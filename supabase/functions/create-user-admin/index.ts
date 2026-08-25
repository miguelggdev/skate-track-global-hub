import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://track.arkanatech.tech';
const ALLOWED_ROLES = ['admin', 'coach', 'athlete', 'delegate', 'leader', 'finance', 'parent'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

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
  const key = `create-user-admin:${ip}`;
  const windowMs = 60;
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

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim().slice(0, 255);
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
      return json({ error: 'Demasiadas solicitudes. Intenta en un momento.' }, 429);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return json({ error: 'Invalid token' }, 401);
    }

    // Check caller permissions using the has_role RPC (correct multi-role check)
    const { data: isAdmin } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    const { data: isCoach } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'coach' });
    const { data: isLeader } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'leader' });

    if (!isAdmin && !isCoach && !isLeader) {
      return json({ error: 'Insufficient permissions' }, 403);
    }

    // Multi-tenant: el usuario nuevo debe quedar en el MISMO club que quien
    // lo crea. get_user_club_id nunca debería devolver null para un caller
    // ya autenticado con rol (todo user_roles.club_id es NOT NULL), pero se
    // valida igual — sin club_id confiable no se crea el usuario.
    const { data: callerClubId, error: clubIdError } = await supabaseAdmin
      .rpc('get_user_club_id', { _user_id: user.id });

    if (clubIdError || !callerClubId) {
      console.error('Error resolving caller club_id:', clubIdError);
      return json({ error: 'No se pudo determinar el club del usuario actual' }, 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Request body inválido' }, 400);
    }

    // Validate and sanitize
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const first_name = sanitizeText(body.first_name);
    const last_name = sanitizeText(body.last_name);
    const role = typeof body.role === 'string' ? body.role : '';
    const phone = sanitizeText(body.phone);
    const id_type = sanitizeText(body.id_type);
    const id_number = sanitizeText(body.id_number);
    const date_of_birth = typeof body.date_of_birth === 'string' ? body.date_of_birth : undefined;
    const gender = typeof body.gender === 'string' ? body.gender : undefined;

    if (!email || !isValidEmail(email)) {
      return json({ error: 'Email inválido' }, 400);
    }

    if (!password || password.length < 8) {
      return json({ error: 'Contraseña debe tener mínimo 8 caracteres' }, 400);
    }

    if (!first_name || first_name.length < 1) {
      return json({ error: 'Nombre requerido' }, 400);
    }

    if (!last_name || last_name.length < 1) {
      return json({ error: 'Apellido requerido' }, 400);
    }

    if (!role || !(ALLOWED_ROLES as readonly string[]).includes(role)) {
      return json({ error: `Rol inválido. Valores permitidos: ${ALLOWED_ROLES.join(', ')}` }, 400);
    }

    // Coaches can only create athletes
    if (isCoach && !isAdmin && role !== 'athlete') {
      return json({ error: 'Los coaches solo pueden crear atletas' }, 403);
    }

    // Validate date_of_birth format if provided
    if (date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
      return json({ error: 'Fecha de nacimiento inválida (YYYY-MM-DD)' }, 400);
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      // false a propósito: Supabase envía un correo de verificación y la
      // cuenta queda inactiva hasta que el usuario haga clic en el enlace
      // — requerimiento de "verificación por enlace al correo para
      // activar cualquier cuenta recién creada" del flujo de onboarding.
      email_confirm: false,
      user_metadata: {
        first_name,
        last_name,
        id_type: id_type || undefined,
        id_number: id_number || undefined,
        phone: phone || undefined,
        date_of_birth,
        gender,
      },
      // app_metadata solo lo puede setear service_role (nunca el cliente vía
      // signUp() público) — es el canal confiable que lee handle_new_user()
      // para asignar role/club_id sin pasar por el flujo de invite_token.
      app_metadata: {
        role: role as AllowedRole,
        club_id: callerClubId,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return json({ error: createError.message }, 400);
    }

    return json({
      success: true,
      user: newUser.user,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error in create-user-admin function:', error);
    return json({ error: 'Error interno del servidor' }, 500);
  }
});
