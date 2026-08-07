/**
 * Seed script — crea 3 usuarios de prueba para los tests E2E de Playwright.
 *
 * Uso:
 *   node scripts/seed-e2e-users.mjs
 *
 * Requiere en .env.local (o variables de entorno del sistema):
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ...  (service_role key, NO la anon key)
 *
 * Al terminar imprime las variables E2E_* que debes pegar en:
 *   - .env.test (para tests locales)
 *   - GitHub Actions / CI secrets (para CI)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Cargar variables de entorno desde .env.local ──────────────────────────────
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const envLocal = loadEnvFile(resolve(__dirname, '../.env.local'));
const envExample = loadEnvFile(resolve(__dirname, '../.env.example'));

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  envLocal['VITE_SUPABASE_URL'] ||
  envExample['VITE_SUPABASE_URL'];

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  envLocal['SUPABASE_SERVICE_KEY'] ||
  envExample['SUPABASE_SERVICE_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY.includes('...')) {
  console.error('❌  Faltan credenciales. Configura en .env.local:');
  console.error('   VITE_SUPABASE_URL=https://xxxx.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=eyJ...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Usuarios a crear ──────────────────────────────────────────────────────────
const TEST_USERS = [
  {
    email: 'e2e-admin@test.skatetrack.dev',
    password: 'E2eAdmin2026!',
    role:  'admin',
    label: 'Admin E2E',
    envKey: 'ADMIN',
  },
  {
    email: 'e2e-coach@test.skatetrack.dev',
    password: 'E2eCoach2026!',
    role:  'coach',
    label: 'Coach E2E',
    envKey: 'COACH',
  },
  {
    email: 'e2e-parent@test.skatetrack.dev',
    password: 'E2eParent2026!',
    role:  'parent',
    label: 'Parent E2E',
    envKey: 'PARENT',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  Creando usuarios E2E...\n');

  const results = [];

  for (const user of TEST_USERS) {
    // 1. Intentar crear el usuario
    const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.label },
    });

    let userId;

    if (createErr) {
      if (createErr.message.toLowerCase().includes('already') || createErr.status === 422) {
        // Ya existe — buscar su ID
        const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = list?.users?.find(u => u.email === user.email);
        if (existing) {
          userId = existing.id;
          console.log(`⚠️  ${user.email} ya existe — reutilizando (id: ${userId.slice(0, 8)}...)`);
        } else {
          console.error(`❌  No se pudo crear ni encontrar ${user.email}: ${createErr.message}`);
          continue;
        }
      } else {
        console.error(`❌  Error creando ${user.email}: ${createErr.message}`);
        continue;
      }
    } else {
      userId = createData.user.id;
      console.log(`✅  ${user.email} creado (id: ${userId.slice(0, 8)}...)`);
    }

    // 2. Asignar rol en user_roles
    const { error: roleErr } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: user.role }, { onConflict: 'user_id,role' });

    if (roleErr) {
      console.warn(`   ⚠️  No se pudo asignar rol ${user.role}: ${roleErr.message}`);
    } else {
      console.log(`   → rol "${user.role}" asignado`);
    }

    results.push({ ...user, id: userId });
  }

  // ── Imprimir variables E2E ────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('📋  Pega estas variables en .env.test (o en los secrets de CI):');
  console.log('─'.repeat(60) + '\n');

  for (const r of results) {
    console.log(`E2E_${r.envKey}_EMAIL=${r.email}`);
    console.log(`E2E_${r.envKey}_PASSWORD=${r.password}`);
  }

  console.log('\n# También agrega en .env.test:');
  console.log(`VITE_SUPABASE_URL=${SUPABASE_URL}`);
  console.log('VITE_SUPABASE_ANON_KEY=<tu anon key>\n');

  console.log('─'.repeat(60));
  console.log('✅  Script terminado. Ejecuta los tests con:');
  console.log('   npx playwright test');
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
