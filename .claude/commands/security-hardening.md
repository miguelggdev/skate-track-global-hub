# /security-hardening — Endurecimiento de Seguridad Completo

Implementa todas las mejoras de seguridad del Agente de Seguridad (AG-08) para el proyecto.

## Áreas de Seguridad a Cubrir

### 1. Edge Functions — Rate Limiting
Para todas las Edge Functions en `supabase/functions/`:

```typescript
// middleware/rateLimiter.ts
const RATE_LIMITS = {
  default: { requests: 60, window: 60 },    // 60 req/min
  ai_agent: { requests: 10, window: 60 },   // 10 req/min (costosas)
  auth: { requests: 5, window: 300 },       // 5 req/5min
}

async function checkRateLimit(ip: string, endpoint: string): Promise<boolean>
```

Implementar usando tabla `rate_limit_cache` en Supabase.

### 2. Migración SQL — Seguridad
```sql
-- Tabla de logs de seguridad
CREATE TABLE security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,  -- 'login', 'login_failed', 'data_access', 'permission_denied'
  ip_address INET,
  user_agent TEXT,
  table_name TEXT,
  operation TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de IPs bloqueadas
CREATE TABLE blocked_ips (
  ip_address INET PRIMARY KEY,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Tabla de rate limiting
CREATE TABLE rate_limit_cache (
  key TEXT PRIMARY KEY,
  count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute'
);
```

### 3. Triggers de Audit Log
Para tablas sensibles: `athletes`, `financial_transactions`, `athlete_body_info`, `profiles`:
```sql
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (user_id, event_type, table_name, operation, details)
  VALUES (auth.uid(), 'data_change', TG_TABLE_NAME, TG_OP, 
          jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Validación de Input — Zod Schemas
Para cada formulario del proyecto, verificar que tenga schema Zod completo.
Archivos a revisar: todos los `*Form.tsx` y `*Dialog.tsx` en `src/components/`.

Agregar sanitización básica:
```typescript
// utils/sanitize.ts
export const sanitizeText = (input: string) =>
  input.replace(/<[^>]*>/g, '').trim()

export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T =>
  schema.parse(data)
```

### 5. Headers de Seguridad en Edge Functions
```typescript
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}
```

### 6. CORS Configuración
Revisar `supabase/config.toml` y todas las Edge Functions para CORS estricto:
- Solo origen permitido: dominio del proyecto
- NO `*` en producción

### 7. UI — Panel de Auditoría (Solo Admin)
Nueva página `src/pages/SecurityAudit.tsx`:
- Log de accesos recientes (últimas 24h, 7 días, 30 días)
- Intentos de login fallidos con IP
- Accesos a datos sensibles
- Filtros: por usuario, por tabla, por tipo de evento
- Alertas de comportamiento anómalo

## Checklist de Seguridad OWASP Top 10

Revisar y corregir cada uno:
- [ ] A01 Broken Access Control → RLS completo
- [ ] A02 Cryptographic Failures → no almacenar contraseñas en texto plano
- [ ] A03 Injection → validación Zod en todos los inputs
- [ ] A04 Insecure Design → audit log en operaciones sensibles
- [ ] A05 Security Misconfiguration → headers, CORS, rate limiting
- [ ] A06 Vulnerable Components → revisar `npm audit`
- [ ] A07 Auth Failures → rate limit en login, session timeout
- [ ] A09 Logging Failures → audit log completo
- [ ] A10 SSRF → no hacer fetch a URLs externas sin validación
