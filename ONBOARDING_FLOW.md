# Flujo de Registro y Onboarding — SpeedSkateTrack Hub
*Documento de arquitectura del flujo de usuario — Julio 2026*

---

## Estado Actual del Login

**El login EXISTE y está funcional** en `/login`:
- Login con email + contraseña (glassmorphism design)
- Recuperación de contraseña por email
- Redirección automática por rol (`RoleBasedRedirect`)
- Trigger `handle_new_user` en DB → crea `profiles` + `user_roles` al signup
- Toggle mostrar/ocultar contraseña
- Spinner animado al cargar

**Lo que NO existe aún:**
- Página de registro/signup para nuevos administradores
- Wizard de onboarding para primer setup del club
- Rol 'admin' automático para el primer usuario

---

## Flujo Completo de Onboarding

```
[/register] → FASE 0: Registro Admin
     ↓
[/onboarding] → FASE 1: Config Club (wizard 4 pasos)
     ↓
[/users] → FASE 2: Agregar coaches y staff
     ↓
[/athletes] → FASE 3: Registrar atletas por categoría
     ↓
[/training] → FASE 4: Horario semanal por categoría
     ↓
[/club-config] → FASE 5: Cuotas y pagos
     ↓
[/competitions] → FASE 6: Primera competencia
     ↓
[/admin-dashboard] → FASE 7: Operación normal
```

---

## FASE 0 — Registro del Primer Administrador

**Problema:** No hay página de signup en el frontend. El primer admin no puede crearse solo.

**Solución a implementar:** Ruta `/register` + Edge Function `register-first-admin`

**Flujo técnico:**
1. Admin visita `/register`
2. Completa: nombre, email, contraseña, nombre del club, código de activación (opcional)
3. Supabase Auth crea usuario → trigger `handle_new_user` crea `profiles` + `user_roles` (role='athlete' por default)
4. Edge Function `register-first-admin` verifica que no existe otro admin → actualiza `user_roles.role = 'admin'`
5. Redirect a `/onboarding`

**Página a crear:** `src/pages/Register.tsx`  
**Edge Function:** `supabase/functions/register-first-admin/index.ts`  
**Ruta en App.tsx:** `<Route path="/register" element={<Register />} />`

**Opciones de implementación (ordenadas por seguridad):**
| Opción | Descripción | Seguridad |
|--------|-------------|-----------|
| A | Magic link de invitación desde Supabase Dashboard | Alta |
| B | Edge Function verifica si es el primer usuario del club | Media-Alta |
| C | Admin creado directamente en Supabase Dashboard (temporal) | Alta (manual) |

**Recomendación:** Opción B para ambiente de desarrollo + Opción A para producción.

---

## FASE 1 — Configuración Inicial del Club (Onboarding Wizard)

**Trigger:** Primer login admin + `club_settings` vacío  
**Ruta:** `/onboarding`  
**Guardia:** Si `club_settings.club_name` está vacío → redirigir a `/onboarding`

### Estructura del Wizard

```
src/pages/Onboarding.tsx
src/components/onboarding/
├── OnboardingWizard.tsx       # Stepper container (4 pasos)
├── OnboardingStep1Club.tsx    # Nombre y abreviatura
├── OnboardingStep2Info.tsx    # Logo, contacto, dirección
├── OnboardingStep3Inst.tsx    # Liga, directivos
├── OnboardingStep4Config.tsx  # Sistema, idioma, moneda
└── OnboardingComplete.tsx     # Pantalla de éxito
```

### Paso 1 — Nombre del Club
```
Campos:
  - club_name (requerido)          → "Club Patinadores Bogotá"
  - club_abbreviation              → "CPB"
  - club_slogan                    → "Velocidad y disciplina"
Tabla: club_settings
```

### Paso 2 — Información Básica
```
Campos:
  - logo_url (upload a Storage)
  - email                          → contacto@clubpatinadores.com
  - phone                          → 601 234 5678
  - address                        → Calle 72 # 14-20
  - city                           → Bogotá
  - country                        → Colombia (default)
  - website                        → www.clubpatinadores.com
Tabla: club_settings
```

### Paso 3 — Información Institucional
```
Campos:
  - league                         → "Liga de Patinaje de Bogotá"
  - president_name + president_email
  - delegate_name + delegate_email
  - doctor_name + doctor_email
Tabla: club_settings
```

### Paso 4 — Configuración del Sistema
```
Campos:
  - timezone                       → "America/Bogota" (default)
  - currency                       → "COP" (default)
  - language                       → "es" (default)
  - academic_year_start            → Mes de inicio del año deportivo (enero)
  - allow_parent_access            → true/false
  - send_email_notifications       → true/false
Tabla: club_settings → system_settings
```

### Paso 5 — ¡Listo!
```
Muestra resumen de lo configurado
Botón: "Ir al Panel de Administración" → /admin-dashboard
```

---

## FASE 2 — Gestión de Usuarios del Club

**Ruta:** `/users` (UserManagement ya implementado)

**Flujo para agregar un coach:**
1. Admin → `/users` → "Agregar Usuario"
2. Completa: nombre, email, rol
3. Edge Function `create-user-admin` crea usuario en Supabase Auth
4. Trigger crea `profiles` + `user_roles` con rol asignado
5. Usuario recibe email → establece contraseña → login → su dashboard

**Roles disponibles y sus dashboards:**
| Rol | Dashboard | Permisos clave |
|-----|-----------|----------------|
| `admin` | `/admin-dashboard` | Todo el sistema |
| `coach` | `/coach-dashboard` | Atletas asignados, entrenamientos, tiempos |
| `athlete` | `/athlete-dashboard` | Sus propios datos, horarios, tiempos |
| `parent` | `/parent-dashboard` | Datos de sus hijos |
| `delegate` | `/admin-dashboard` | Vista de informes |
| `finance` | `/finance-dashboard` | Pagos, cuotas, reportes financieros |
| `medical` | `/admin-dashboard` | Datos médicos atletas |

---

## FASE 3 — Registro de Atletas

**Ruta:** `/athletes` → botón "Agregar Atleta"  
**Componente:** `<AddAthleteDialog />` → ya implementado  
**Perfil completo:** `<EditAthleteDialog />` con 9 tabs (ya implementado)

**Categorías del club (Colombia — FCP):**
| Categoría | Edad | Descripción |
|-----------|------|-------------|
| Escuela | 5-7 años | Iniciación al patinaje |
| Pre-infantil | 8-9 años | Fundamentos técnicos |
| Infantil | 10-11 años | Desarrollo técnico |
| Juvenil | 12-13 años | Competencia regional |
| Pre-junior | 14-15 años | Alta competencia |
| Junior | 16-17 años | Nivel nacional |
| Mayor | 18+ años | Elite / Masters |

**Documentos requeridos (FilesTab — ya implementado):**
- Copia de documento de identidad / registro civil
- Carnet EPS
- Carnet de Liga
- Carnet Federación (si es federado)
- Póliza de accidentes
- Autorización de tratamiento de datos

**Flujo de registro masivo (próxima implementación):**
- Skill `/bulk-import` → importación desde Excel con template estandarizado

---

## FASE 4 — Horario Semanal de Entrenamientos

**Ruta:** `/training` (TrainingCalendar ya implementado)

**Flujo para crear sesión:**
1. Coach/Admin → `/training` → click en día del calendario
2. "Nueva Sesión" → formulario:
   - Nombre de la sesión
   - Categorías (multi-select)
   - Hora inicio / fin
   - Lugar (pista cubierta / al aire libre / gimnasio)
   - Tipo: técnica | fondo | velocidad | gym | cross-training
   - Coach asignado
3. Sesión aparece en el calendario
4. Atletas ven su horario en `/athlete-dashboard`

**Template semanal sugerido (ejemplo club):**
| Día | Turno Mañana | Turno Tarde |
|-----|-------------|-------------|
| Lunes | Escuela + Pre-infantil (6-8am) | Juvenil + Pre-junior (4-7pm) |
| Martes | — | Mayor + Junior (4-7pm) |
| Miércoles | — | Todos (4-7pm) — Técnica grupal |
| Jueves | — | Mayor + Junior (4-7pm) |
| Viernes | — | Escuela + Infantil (4-6pm) |
| Sábado | Fondo general (7-10am) | Competencia / libre |
| Domingo | Libre | — |

**Registro de asistencia:**
- Tabla `training_attendance` ya existe en el schema
- Coach marca asistencia al inicio de cada sesión
- Estadísticas en dashboard de atleta y coach

---

## FASE 5 — Configuración de Pagos y Cuotas

**Ruta:** `/club-config` → pestaña "Pagos" (PaymentSettings ya implementado)

**Configurar:**
- Cuota mensual por categoría
- Matrícula / inscripción anual
- Métodos de pago aceptados
- Datos bancarios del club para consignaciones

**Automatizaciones (Sprint 5):**
- AUTO-07: Generación automática de cobros mensuales
- AUTO-08: Recordatorio de pago vía email/WhatsApp
- AUTO-09: Reporte mensual de cartera
- AUTO-10: Alerta de mora (30+ días)
- AUTO-11: Recibo de pago automático

---

## FASE 6 — Primera Competencia

**Ruta:** `/competitions`

**Flujo:**
1. Admin crea competencia: nombre, fecha, lugar, tipo (pista/maratón/libre)
2. Registra categorías participantes
3. Registra atletas inscritos por categoría
4. Post-competencia: importar resultados
5. Sistema actualiza rankings y estadísticas automáticamente

**Importación de resultados:**
- Manual: formulario por atleta
- Masiva: Skill `/competition-import` → CSV con resultados oficiales FCP

---

## FASE 7 — Operación Normal

El club opera en ciclo semanal:

```
LUNES A VIERNES
  Entrenamientos → Coach registra asistencia
  Coach registra tiempos → TimeRecordForm
  
MENSUAL
  Finance registra pagos → /finance
  Admin genera reportes → /reports
  
SEGÚN NECESIDAD
  Agentes IA responden consultas (Sprint 4)
  Importación de resultados de competencias
  Actualización de documentos de atletas
```

---

## Mejoras del Login Implementadas

| Mejora | Estado |
|--------|--------|
| Toggle mostrar/ocultar contraseña | ✅ Implementado |
| Spinner animado (Loader2) al cargar | ✅ Implementado |
| Año copyright: 2025 → 2026 | ✅ Implementado |
| Ícono de patín (⛸️) en el header | ✅ Implementado |
| Logo dinámico desde club_settings | ⬜ Pendiente (requiere query a DB) |
| Nombre del club dinámico | ⬜ Pendiente (actualmente hardcodeado) |
| Link "Solicitar acceso" para nuevos admins | ⬜ Pendiente (requiere /register) |
| Animaciones framer-motion | ⬜ Futuro (Sprint 6) |
| Magic link / login sin contraseña | ⬜ Futuro (Sprint 7) |

---

## Mejoras Generales del Frontend

### Alta Prioridad

**1. Index.tsx (`/`) — Datos mock hardcodeados**
La página `/` tiene datos ficticios en inglés ("$53,000", "John Michael", "React Material Dashboard").
Debe reemplazarse con datos reales del club o redirigir al dashboard del rol correspondiente.

**2. Flujo de registro** — Ningún admin puede crearse solo actualmente.

**3. Guardia de onboarding** — Si `club_settings` está vacío, redirigir a `/onboarding`.

### Media Prioridad

**4. Dashboard Admin** — Conectar métricas con datos reales de Supabase:
   - Atletas activos → `COUNT(athletes WHERE status='active')`
   - Sesiones del mes → `COUNT(training_sessions WHERE month=current)`
   - Ingresos del mes → `SUM(payments WHERE month=current)`
   - Asistencia promedio → `AVG(training_attendance.presente)`

**5. Tablas de atletas** — Añadir paginación real con TanStack Query.

**6. Calendario** — Verificar que muestra sesiones reales de `training_sessions`.

### Baja Prioridad (Sprint 6)

**7. PWA** — Service Worker para notificaciones push y acceso offline.

**8. Mobile** — Auditoría responsive completa (skill `/responsive-audit`).

**9. Dark/Light theme** — Verificar consistencia en todos los dashboards.

---

## Skills Disponibles (20 comandos)

```
/design-system          → Audita y mejora el sistema de diseño
/responsive-audit       → Verifica mobile-first en todos los componentes
/rls-policy             → Genera/audita políticas de seguridad RLS
/agent-create           → Crea un nuevo agente LangGraph desde template
/rag-pipeline           → Configura pipeline de embeddings + retrieval
/competition-import     → Importa resultados de competencia desde CSV
/chat-widget            → Implementa widget de chat para un agente IA
/training-plan-gen      → Genera plan de entrenamiento con IA
/nutrition-plan-gen     → Genera plan nutricional con IA
/gym-routine-gen        → Genera rutina de gimnasio con IA
/notification-system    → Implementa sistema de notificaciones push
/dashboard-upgrade      → Mejora un dashboard con datos reales + charts
/security-hardening     → Auditoría completa de seguridad
/pgvector-setup         → Configura pgvector para embeddings RAG
/audit-log              → Implementa log de auditoría de acciones
/bulk-import            → Importación masiva de atletas desde Excel
/ui-ux-pro-max          → Rediseño UI/UX de nivel producción
/cycling-crosstraining  → Módulo de ciclismo como cross-training
/colombia-skating-reference → Referencia normativa FCP/Liga Colombia
/skating-expert         → Consulta al agente experto en patinaje de velocidad
```

---

## Próximos Pasos Recomendados

### Sprint 2 (inmediato)
1. ~~**SPEC-009** — Flujo de registro: página `/register` + migración trigger seguro~~ ✅ DONE
2. **SPEC-010** — Wizard de onboarding: `/onboarding` con 4 pasos
3. **SPEC-011** — Guard de onboarding: redirect si club no está configurado

### Sprint 2-3 (backend)
4. Setup FastAPI + LangGraph (ver WORK_PLAN.md Sprint 2)
5. Agentes AG-01 (Admin) y AG-02 (Coach) MVP

### Skill a usar ahora
- `/dashboard-upgrade` → Conectar Index.tsx con datos reales
- `/ui-ux-pro-max` → Rediseño completo del frontend para nivel producción
