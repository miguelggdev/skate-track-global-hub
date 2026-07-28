# LEGACY_REFERENCE.md — Referencia de las 124 Migraciones de Lovable
## Este archivo es el "mapa de requerimientos" extraído del historial de git

**Propósito:** Las 124 migraciones de Lovable contienen los requerimientos que se fueron pidiendo.
Este documento los abstrae limpiamente para usarlos como referencia de desarrollo.
No se ejecuta nada de aquí directamente — se migra tabla por tabla de forma correcta.

---

## Tablas identificadas en las 124 migraciones (26 en total)

### YA IMPLEMENTADAS en nuestro schema limpio ✅

| Tabla legacy | Tabla actual | Estado |
|---|---|---|
| `profiles` | `profiles` | ✅ Mejorada (sin role column) |
| `athletes` | `athletes` | ✅ Expandida (+30 campos) |
| `training_sessions` | `training_sessions` | ✅ Expandida (tipo, km, ejercicios) |
| `training_attendance` | `attendance` | ✅ Equivalente |
| `competitions` | `competitions` | ✅ Expandida (tipo, coach responsable) |
| `competition_results` | `competition_results` | ✅ Equivalente |
| `financial_transactions` | `transactions` | ✅ Expandida (pagador, recibo, período) |
| `notifications` | `notifications` | ✅ Mejorada |
| `club_settings` | `club_settings` | ✅ Equivalente |
| `equipment` | `equipment` | ✅ Ampliada (mantenimiento, asignación) |

### IMPLEMENTADAS NUEVAS (no estaban en Lovable, las agregamos) ✅

| Tabla nueva | Propósito |
|---|---|
| `race_events` | Tipos de prueba (300m CRI, 5km fondo…) con 14 pre-cargadas |
| `time_records` | Tiempos cronometrados con auto-récord personal |
| `equipment_maintenance` | Historial mantenimiento de equipos |
| `courtesy_classes` | Clases de prueba para nuevos atletas |
| `documents` | Cartas permiso, carnets, pólizas, certificados |
| `document_templates` | Plantillas HTML para generar PDFs |
| `evaluations` | Evaluaciones técnicas/físicas periódicas |
| `messages` | Mensajería interna entre roles |
| `special_events` | Ceremonias, campamentos, muestras |
| `special_event_participants` | Participantes en eventos especiales |
| `user_roles` | Roles múltiples por usuario |

### IMPLEMENTADAS en migración 20260103 ✅

| Tabla | Prioridad | Sprint | Propósito |
|---|---|---|---|
| `coaches` | ALTA | 1 | ✅ Entrenadores con licencia, especialización, años de exp. |
| `coach_athletes` | ALTA | 1 | ✅ Relación entrenador ↔ atleta (M:M) |
| `competition_events` | ALTA | 1 | ✅ Eventos específicos dentro de una competencia |
| `competition_registrations` | ALTA | 1 | ✅ Inscripción de atletas a eventos de competencia |
| `medical_sessions` | ALTA | 2 | ✅ Sesiones médicas, lesiones, seguimiento |
| `athlete_body_info` | MEDIA | 2 | ✅ Tabla separada con datos médicos (mejor RLS) |
| `athlete_family` | MEDIA | 2 | ✅ Tabla separada de familia/acudientes |
| `athlete_studies` | MEDIA | 2 | ✅ Tabla separada de datos académicos |
| `athlete_equipment` | MEDIA | 2 | ✅ Equipo personal del atleta (patines, chasis, ruedas) |
| `athlete_history` | MEDIA | 3 | ✅ Club anterior, federación, liga, experiencia |
| `athlete_gallery` | BAJA | 3 | ✅ Galería de hasta 5 fotos por atleta |
| `athlete_socials` | BAJA | 3 | ✅ Instagram, TikTok, WhatsApp, YouTube |
| `training_kpis` | MEDIA | 3 | ✅ KPIs mensuales calculados (horas, asistencia, distribución) |
| `system_settings` | ALTA | 1 | ✅ Configuración clave-valor del sistema |

### PENDIENTES — Por implementar ⏳

| Tabla | Prioridad | Sprint | Propósito |
|---|---|---|---|
| `attendance_summaries` | MEDIA | 3 | Resúmenes pre-calculados de asistencia por mes |

---

## ENUMs identificados en Lovable (estado)

| ENUM legacy | Valores Lovable | Nuestro ENUM actual |
|---|---|---|
| `user_role` | admin, coach, athlete, delegate, leader, finance | ✅ Igual + 'finance' |
| `athlete_status` | active, inactive, injured, suspended | ✅ Igual |
| `athlete_category` | youth, junior, senior, masters | ✅ Reemplazado por nombres en español |
| `competition_status` | upcoming, ongoing, completed, cancelled | ⏳ Agregar a competitions |
| `payment_status` | pending, paid, overdue, cancelled | ✅ `transaction_status` equivalente |
| `training_type` | technical, physical, mental, recovery | ✅ Reemplazado (regular, bicicleta, cortesia) |
| `event_type` | (varios tipos de carrera) | ✅ `race_event_type` más completo |
| `medal_type` | gold, silver, bronze | ✅ En `awards.medal_type` |
| `id_type` | (tipos de identificación) | ⏳ Agregar como texto en athletes |

---

## Columnas de `athletes` identificadas en Lovable (no en nuestro schema)

Estas columnas estaban en migrations de Lovable y hay que validar si ya las tenemos:

```
main_discipline      → ⏳ falta (= specialty nuestro)
bio                  → ⏳ falta (texto libre del atleta)
personal_values      → ⏳ falta
short_term_goals     → ⏳ falta
long_term_goals      → ⏳ falta
club_name            → ⏳ falta (club anterior)
profile_image_url    → ✅ = photo_url nuestro
```

---

## Funcionalidades identificadas en el frontend de Lovable
*(deducidas del análisis de las migraciones y el código)*

1. **Gestión completa de atletas** con tabs: Personal / Médico / Familia / Académico / Deportivo / Equipo
2. **Dashboard por rol** con KPIs reales conectados a BD
3. **Registro de asistencia** con QR y manual
4. **Gestión de competencias** con inscripción por evento
5. **Medallería** con historial por atleta y por competencia
6. **Sistema financiero** completo con recibos automáticos
7. **Módulo médico** con sesiones y seguimiento
8. **Notificaciones** en tiempo real
9. **Galería de fotos** por atleta
10. **Redes sociales** por atleta
11. **Configuración del sistema** con parámetros clave-valor

---

## Estrategia de recuperación

**El principio:** No re-ejecutar las 124 migraciones (tenían bugs).
En su lugar, usar este documento como checklist de features a implementar.

**El flujo:**
```
1. Identificar feature en LEGACY_REFERENCE.md
2. Crear spec en specs/sprint-XX/SPEC-XXX-nombre.md
3. Escribir migración limpia y correcta
4. Implementar frontend
5. Marcar como ✅ en este documento
```

**Archivos de referencia en git:**
- Commit padre con las 124 migraciones: `ae970f8^` (en rama master local)
- Para recuperar cualquier archivo: `git show ae970f8^:supabase/migrations/[nombre].sql`
