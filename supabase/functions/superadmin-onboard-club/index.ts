import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Onboarding interno de clubes — solo lo puede invocar un platform_admin
// autenticado (verificado abajo vía is_platform_admin RPC). Sin esto, la
// creación de clubes/admins es 100% manual desde el panel del superadmin,
// nunca por auto-registro público. Ver
// supabase/migrations/20260824100000_superadmin_platform_role.sql.

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://track.arkanatech.tech';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
  });
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, ip: string): Promise<boolean> {
  const key = `superadmin-onboard-club:${ip}`;
  const windowMs = 300; // 5 min window
  const maxRequests = 10;

  const { data } = await supabase
    .from('rate_limit_cache')
    .select('count, window_start')
    .eq('key', key)
    .single() as { data: { count: number; window_start: string } | null };

  const now = new Date();

  if (!data) {
    await supabase.from('rate_limit_cache').upsert({
      key,
      count: 1,
      window_start: now.toISOString(),
      expires_at: new Date(now.getTime() + windowMs * 1000).toISOString(),
    });
    return true;
  }

  const windowStart = new Date(data.window_start);
  const elapsed = (now.getTime() - windowStart.getTime()) / 1000;

  if (elapsed > windowMs) {
    await supabase.from('rate_limit_cache').update({
      count: 1,
      window_start: now.toISOString(),
      expires_at: new Date(now.getTime() + windowMs * 1000).toISOString(),
    }).eq('key', key);
    return true;
  }

  if (data.count >= maxRequests) return false;

  await supabase.from('rate_limit_cache').update({ count: data.count + 1 }).eq('key', key);
  return true;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDomain(domain: string): boolean {
  // Dominio o subdominio simple: letras/números/guiones separados por puntos.
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain);
}

function sanitizeText(value: unknown, maxLen = 255): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const allowed = await checkRateLimit(supabaseAdmin, ip);
    if (!allowed) {
      return json({ error: 'Demasiadas solicitudes. Intenta en unos minutos.' }, 429);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'No autorizado - falta token de autenticación' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return json({ error: 'No autorizado - sesión inválida o expirada' }, 401);
    }

    const { data: isPlatformAdmin, error: paError } = await supabaseAdmin
      .rpc('is_platform_admin', { _user_id: user.id });

    if (paError || !isPlatformAdmin) {
      return json({ error: 'Solo el equipo de la plataforma puede dar de alta clubes' }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Request body inválido' }, 400);
    }

    // ── Validar datos del club ──────────────────────────────────────────
    const club_name = sanitizeText(body.club_name);
    const custom_domain = sanitizeText(body.custom_domain, 255).toLowerCase();
    const address = sanitizeText(body.address, 500);
    const city = sanitizeText(body.city);
    const country = sanitizeText(body.country);
    const contact_phone = sanitizeText(body.contact_phone, 50);
    const mobile_phone = sanitizeText(body.mobile_phone, 50);

    // ── Validar datos del admin ──────────────────────────────────────────
    const admin_name = sanitizeText(body.admin_name);
    const admin_email = typeof body.admin_email === 'string' ? body.admin_email.trim().toLowerCase() : '';

    if (!club_name || club_name.length < 2) {
      return json({ error: 'Nombre del club requerido' }, 400);
    }
    if (!custom_domain || !isValidDomain(custom_domain)) {
      return json({ error: 'Dominio/subdominio inválido' }, 400);
    }
    if (!admin_name) {
      return json({ error: 'Nombre del administrador requerido' }, 400);
    }
    if (!admin_email || !isValidEmail(admin_email)) {
      return json({ error: 'Email del administrador inválido' }, 400);
    }

    const [admin_first_name, ...rest] = admin_name.split(' ');
    const admin_last_name = rest.join(' ');

    // ── Crear el club ────────────────────────────────────────────────────
    const { data: club, error: clubError } = await supabaseAdmin
      .from('clubs')
      .insert({
        name: club_name,
        custom_domain,
        address: address || null,
        city: city || null,
        country: country || null,
        contact_phone: contact_phone || null,
        mobile_phone: mobile_phone || null,
        contact_email: admin_email,
      })
      .select('id, name, custom_domain')
      .single();

    if (clubError) {
      if (clubError.code === '23505') {
        return json({ error: 'Ese dominio ya está en uso por otro club' }, 409);
      }
      console.error('Error creating club:', clubError);
      return json({ error: 'No se pudo crear el club' }, 500);
    }

    // ── Invitar al administrador (envía correo con link para fijar
    // contraseña — no se genera ni transmite ninguna contraseña temporal) ──
    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      admin_email,
      {
        data: { first_name: admin_first_name, last_name: admin_last_name },
        // app_metadata: solo service_role puede setearlo — canal confiable
        // que lee handle_new_user() para asignar role/club_id sin invite_token.
      }
    );

    if (inviteError || !invited?.user) {
      // Rollback del club — sin admin, un club huérfano solo confunde.
      await supabaseAdmin.from('clubs').delete().eq('id', club.id);
      console.error('Error inviting admin:', inviteError);
      return json({ error: inviteError?.message ?? 'No se pudo invitar al administrador' }, 500);
    }

    // inviteUserByEmail dispara handle_new_user() en el INSERT a
    // auth.users ANTES de que podamos setear app_metadata — en ese
    // momento no hay role/club_id confiables, así que el trigger cae al
    // fallback: role='athlete' (y de paso crea una fila en `athletes`,
    // que no corresponde para un admin) + club_id = default_club_id()
    // (el primer club existente, no el que se acaba de crear). Se corrige
    // el estado a mano acá, en vez de intentar evitar el trigger:
    await supabaseAdmin.auth.admin.updateUserById(invited.user.id, {
      app_metadata: { role: 'admin', club_id: club.id },
    });

    await supabaseAdmin.from('athletes').delete().eq('user_id', invited.user.id);
    await supabaseAdmin.from('user_roles').delete().eq('user_id', invited.user.id);
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: invited.user.id,
      club_id: club.id,
      role: 'admin',
    });

    if (roleError) {
      console.error('Error assigning admin role after invite:', roleError);
      return json({ error: 'El administrador se invitó pero no se pudo asignar su rol. Contacta soporte.' }, 500);
    }

    return json({
      success: true,
      club,
      admin: { id: invited.user.id, email: admin_email },
      message: 'Club creado. Se envió un correo al administrador para configurar su contraseña.',
    });
  } catch (error) {
    console.error('Error in superadmin-onboard-club function:', error);
    return json({ error: 'Error interno del servidor' }, 500);
  }
});
