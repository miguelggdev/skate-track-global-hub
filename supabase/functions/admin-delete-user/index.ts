import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://byaxcqhxxxdjogvdhyqn.supabase.co';

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
  const key = `admin-delete-user:${ip}`;
  const windowMs = 300; // 5 min window
  const maxRequests = 5;

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting
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

    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      return json({ error: 'Solo los administradores pueden eliminar usuarios' }, 403);
    }

    // Validate body
    let body: { userId?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Request body inválido' }, 400);
    }

    const { userId } = body;

    if (!userId || typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) {
      return json({ error: 'ID de usuario inválido' }, 400);
    }

    if (userId === user.id) {
      return json({ error: 'No puedes eliminar tu propio usuario' }, 400);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return json({ error: 'Error al eliminar el usuario' }, 500);
    }

    return json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error in admin-delete-user function:', error);
    return json({ error: 'Error interno del servidor' }, 500);
  }
});
