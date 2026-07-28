# SYSTEM DESIGN — SpeedSkateTrack Hub
## Análisis de requerimientos y flujo de información
*Actualizado: Sprint 1 — antes de implementar módulos nuevos*

---

## 1. FLUJO DE INFORMACIÓN DEL SISTEMA (Onboarding Order)

El sistema tiene un orden lógico de creación de datos. Si se salta un paso, los demás fallan.

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: CONFIGURAR EL CLUB                                 │
│  → Nombre, NIT, dirección, logo, ciudad, teléfono           │
│  → Temporada activa, tarifas de mensualidad por categoría   │
│  → Parámetros: sesiones/semana, % mínimo asistencia, etc.   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: CREAR USUARIOS (Admin primero)                     │
│  → Admin (ya existe al registrarse)                         │
│  → Líder directivo                                          │
│  → Financiero / Tesorero                                    │
│  → Entrenadores (con perfil profesional y licencia)         │
│  → Delegados de competencia                                 │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: REGISTRAR DEPORTISTAS                              │
│  → Datos personales + categoría (auto por fecha nacimiento) │
│  → Perfil médico (EPS, grupo sanguíneo, alergias)           │
│  → Datos de familia / acudientes                            │
│  → Datos académicos (colegio, grado)                        │
│  → Historial deportivo (club anterior, federación, liga)    │
│  → Equipo personal (patines, chasis, ruedas)                │
│  → Asignar a entrenador                                     │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: ENTRENAMIENTO                                      │
│  → Crear sesión de entrenamiento (tipo, fecha, duración, km)│
│  → Registrar asistencia (manual o QR)                       │
│  → KPIs mensuales automáticos (asistencia %, km, horas)     │
│  → Evaluaciones técnicas periódicas                         │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: COMPETENCIAS                                       │
│  → Crear competencia (nombre, tipo, fecha, sede)            │
│  → Definir eventos (500m CRI Juvenil F, 3km Fondo Senior M) │
│  → Inscribir atletas por evento                             │
│  → CARGAR RESULTADOS (manual o OCR desde PDF/imagen)        │
│  → Detectar records personales automáticamente              │
│  → Generar medallería y ranking                             │
│  → Exportar resultados a Excel                              │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 6: FINANZAS                                           │
│  → Generar cobros de mensualidad por categoría              │
│  → Registrar pagos con recibo numerado                      │
│  → Alertas de mora (+30 días)                               │
│  → Cartas de permiso automáticas (PDF) para competencias    │
│  → Carnets del club con QR                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 7: DASHBOARDS POR ROL                                 │
│  → Admin: métricas globales + todos los módulos             │
│  → Entrenador: mis atletas + asistencia + KPIs + tiempos    │
│  → Atleta: mi perfil + mis tiempos + ranking + pagos        │
│  → Financiero: pagos + mora + recibos + reportes            │
│  → Delegado: competencias + inscripciones + resultados      │
│  → Líder: reportes ejecutivos + visión estratégica          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. MÓDULO DE CARGA DE RESULTADOS (OCR + IA)

### El problema
Los resultados de competencias llegan en 3 formatos:
1. **PDF oficial de Fedepatin** — Campeonatos Nacionales, Panamericanos
2. **PDF/imagen de Distritales Bogotá** — Resultados por categoría
3. **Imagen fotográfica** — Foto del tablero o resolución impresa

### Arquitectura propuesta

```
Usuario sube PDF/imagen
        │
        ▼
┌─────────────────────┐
│  Frontend Upload UI  │  Drag & drop, muestra preview
│  (React + shadcn)   │
└──────────┬──────────┘
           │ POST multipart/form-data
           ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Python (FastAPI) — Endpoint /results/import    │
│                                                         │
│  1. Si PDF → pdfplumber extrae texto                    │
│  2. Si imagen → Claude Vision API (base64)              │
│  3. Texto → Claude claude-sonnet-4-6 extrae JSON:                │
│     {                                                   │
│       "competition": "Distritales Bogotá 2025",         │
│       "date": "2025-08-15",                             │
│       "venue": "Parque El Tunal",                       │
│       "event": "500m CRI",                              │
│       "category": "juvenil",                            │
│       "gender": "femenino",                             │
│       "results": [                                      │
│         { "pos": 1, "name": "María García",             │
│           "club": "Club Rionegro",                      │
│           "time": "00:42.35", "points": 34 }            │
│       ]                                                 │
│     }                                                   │
│  4. Fuzzy match nombres contra athletes en BD           │
│  5. Retorna preview al frontend para validación         │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend — Pantalla de Revisión/Validación             │
│                                                         │
│  ┌─ Datos detectados ──────────────────────────────┐   │
│  │ Competencia: Distritales Bogotá 2025            │   │
│  │ Fecha: 15 Ago 2025  │  Evento: 500m CRI         │   │
│  │ Categoría: Juvenil Femenino                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Resultados ─────────────────────────────────────┐  │
│  │ Pos │ Nombre Detectado  │ Match BD    │ Tiempo  │  │
│  │  1  │ María García      │ ✅ Exacto   │ 0:42.35 │  │
│  │  2  │ Ana Martínez      │ ⚠️ Similar  │ 0:43.12 │  │
│  │  3  │ Sofia Rodríguez   │ ❌ No enc.  │ 0:43.89 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Seleccionar atleta para ❌/⚠️]  [Ignorar fila]       │
│                                                         │
│  [Confirmar e Importar] ←──────────────────────────    │
└─────────────────────────────────────────────────────────┘
           │ POST /results/confirm
           ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase — Insertar en:                                │
│  • competition_results (pos, time, puntos, atleta)      │
│  • time_records (si es nuevo récord personal)           │
│  • awards (si es medalla 🥇🥈🥉)                        │
│  • audit_log (trazabilidad de la importación)           │
└─────────────────────────────────────────────────────────┘
```

### Datos a extraer de los documentos

#### Formato Fedepatin (Nacional / Panamericanos)
```
Campos típicos: Pos | Nro | Nombre | Club/País | Tiempo | Diferencia | Puntos
Metadatos del encabezado: Evento, Categoría, Género, Fecha, Sede, Juez árbitro
```

#### Formato Distritales Bogotá
```
Campos típicos: Pos | Nombre | Club | Tiempo | Puntos acumulados
Metadatos: Etapa (1ra/2da/Final), Fecha, Pista
```

### Casos especiales a manejar
- **Descalificaciones (DSQ/DQ)** — registrar como DSQ en time_records
- **No presentado (DNS)** — registrar pero no afectar ranking
- **No terminó (DNF)** — registrar
- **Atleta no en BD** — permitir crear nuevo atleta inline o ignorar
- **Misma competencia ya importada** — detectar duplicados y advertir

---

## 3. RAG — CHATBOT DEL REGLAMENTO

### Casos de uso

| Usuario | Pregunta típica |
|---|---|
| Deportista | "¿Qué pasa si salgo antes de la señal de salida?" |
| Entrenador | "¿Cuántos metros tiene la zona de descalificación en 300m CRI?" |
| Padre | "¿Qué documentos necesita mi hijo para competir en un nacional?" |
| Delegado | "¿Cuál es el proceso de protesta en una carrera?" |

### Arquitectura

```
PDF Reglamento (Fedepatin / FISU / WS)
        │
        ▼
┌───────────────────────────────────┐
│  Backend Python — Indexación      │
│  1. pdfplumber → texto por página │
│  2. Dividir en chunks (500 tokens)│
│  3. Claude Embeddings → vector    │
│  4. INSERT INTO knowledge_base    │
│     (category: 'reglamento')      │
└───────────────────────────────────┘
        │
        │ (una sola vez, o al actualizar el reglamento)
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  Chat UI (React) — Disponible en dashboard atleta,    │
│  entrenador y padres                                   │
│                                                        │
│  Usuario pregunta → embedding de la pregunta          │
│  → search_knowledge_base() → top 5 chunks relevantes  │
│  → Claude claude-sonnet-4-6 genera respuesta con contexto        │
│  → Cita el artículo del reglamento                    │
└───────────────────────────────────────────────────────┘
```

### Agente específico: AG-11 Normativa
- Accede SOLO a `knowledge_base` con category='reglamento'
- Cita siempre el artículo fuente
- Si no sabe, dice "consultar directamente a Fedepatin"
- Disponible para atletas, entrenadores, padres (no solo admin)

---

## 4. AGENTE CONECTADO A LA BD

### AG-01 (Admin) y AG-02 (Coach) con acceso a datos reales

```
Usuario: "¿Cuántos atletas en categoría juvenil tienen mora?"
        │
        ▼
Agente → genera SQL seguro via Supabase client
        → ejecuta con RLS del rol del usuario
        → formatea respuesta en lenguaje natural
```

### Tipos de consultas por rol

| Rol | Consultas típicas |
|---|---|
| Admin | Mora total, atletas inactivos, ranking general del club |
| Entrenador | Asistencia semanal de mis atletas, quien no ha venido esta semana |
| Atleta | Mis 5 mejores tiempos, mi progreso en 500m CRI, ¿cuándo es la próxima competencia? |
| Financiero | Deudores del mes, total recaudado, proyección de ingresos |
| Delegado | Atletas inscritos en Distritales, quién falta por pagar inscripción |

### Restricciones de seguridad del agente
- El agente NUNCA genera SQL directamente ejecutable por el usuario
- Usa funciones predefinidas en Supabase (RLS protege todo)
- No accede a datos de salud sin ser coach/admin
- Logs en audit_log de cada consulta del agente

---

## 5. CALENDARIO POR CATEGORÍA

### Vistas necesarias

```
Vista 1: Calendario de ENTRENAMIENTOS
  → Filtro: categoría / entrenador
  → Color por tipo (técnico, físico, cortesía, bicicleta)
  → Click → ver asistencia de esa sesión

Vista 2: Calendario de COMPETENCIAS
  → Filtro: categoría (Juvenil / Júnior / Senior / Mayores)
  → Tipos: Distrital / Departamental / Nacional / Panamericano
  → Click → ver eventos del día, inscripciones, resultados

Vista 3: TIMELINE del deportista
  → Vista personal del atleta
  → Sus entrenamientos, sus competencias, sus pagos
```

### Integración con Google Calendar (Sprint 7)
- Admin puede sincronizar competencias al Google Calendar del club
- Atletas reciben invitación automática a sus competencias

---

## 6. IMÁGENES QUE PUEDES COMPARTIR

Para diseñar el extractor OCR correctamente, necesito que compartas:

### Documentos a analizar
1. **Imagen de resultados de Distritales Bogotá** — para ver el formato exacto de las columnas
2. **Resolución/PDF de Fedepatin** (Panamericanos o Nacional) — para ver el encabezado y estructura
3. **Si tienes: planilla de inscripción** — para ver cómo cruzan los datos con resultados

### Qué validaré en esos documentos
- Nombres exactos de las columnas
- Formato del tiempo (mm:ss.cc o hh:mm:ss.cc)
- Cómo identifican categoría y género
- Si viene el número dorsal o solo el nombre
- Cómo están los metadatos del evento (en el encabezado)
- Si hay tablas de puntos acumulados (para ligas)

---

## 7. GAPS EN EL SCHEMA ACTUAL

Revisando el flujo vs el schema existente:

| Feature | Estado | Acción |
|---|---|---|
| Carga de resultados OCR | ❌ No existe | Nueva tabla `result_imports` + backend Python |
| Calendario por categoría | ✅ Datos en BD | Solo falta UI (calendar component) |
| RAG reglamento | ✅ `knowledge_base` lista | Falta indexar el PDF + chat UI |
| Agente con BD queries | ⏳ Parcial | Backend Python Sprint 2 |
| Flujo onboarding | ❌ No existe | Wizard de configuración inicial |
| Liga / puntos acumulados | ❌ No existe | Nueva tabla `league_standings` |
| Resoluciones / actas | ❌ No existe | Tabla `competition_resolutions` |
| Puntos por posición | ❌ No existe | Config tabla `point_tables` |
| Calendario UI | ❌ No existe | React component (FullCalendar o similar) |

### Tablas nuevas identificadas

```sql
-- Para importación de resultados con trazabilidad
result_imports (id, file_url, competition_id, imported_by, status, raw_data jsonb, errors jsonb, created_at)

-- Para ligas con puntos acumulados por temporada  
league_standings (id, league_id, athlete_id, category, total_points, position, season_year)
leagues (id, name, season_year, category, organizer, start_date, end_date)

-- Para actas y resoluciones oficiales
competition_resolutions (id, competition_id, document_url, resolution_number, issued_by, issued_at)

-- Tabla de puntos por posición (configurable por tipo de competencia)
point_tables (id, competition_type, position, points, created_at)
```

---

## 8. PLAN DE ACCIÓN ACTUALIZADO

### Antes del Sprint 2 (Backend Python) — agregar al Sprint 1:

| Prioridad | Tarea | Spec |
|---|---|---|
| ALTA | Analizar imágenes de resultados que compartas | Manual |
| ALTA | Migración: `result_imports`, `leagues`, `league_standings` | SPEC-009-bis |
| ALTA | Migración: `point_tables`, `competition_resolutions` | SPEC-009-bis |
| ALTA | Indexar PDF del reglamento en knowledge_base | Manual + script Python |
| MEDIA | UI: Calendario de competencias por categoría | SPEC-010 |
| MEDIA | UI: Módulo de importación de resultados (frontend) | SPEC-011 |

### Sprint 2 (Backend Python) — prioridades actualizadas:

| Prioridad | Tarea |
|---|---|
| CRÍTICA | FastAPI endpoint `/results/import` (OCR + Claude Vision) |
| CRÍTICA | Script de indexación del reglamento en knowledge_base |
| ALTA | AG-11 (Normativa RAG) — chatbot del reglamento |
| ALTA | AG-10 (Resultados) — extractor OCR con validación |
| ALTA | AG-01 (Admin) con queries a BD vía Supabase client |

---

## 9. PREGUNTAS PARA VALIDAR ANTES DE IMPLEMENTAR

1. **¿Qué PDF del reglamento usas?** ¿Reglamento Fedepatin, FISU o World Skate (WS)?
2. **¿La app maneja ligas?** ¿Los puntos se acumulan por temporada (ej: Copa Bogotá con 3 etapas)?
3. **¿Los dorsales/bibs se asignan por categoría o son fijos por atleta?**
4. **¿El resultado incluye puntos de liga o solo tiempos?**
5. **¿Quién puede importar resultados?** ¿Solo admin/delegado, o también el entrenador?
6. **¿La app necesita manejar resultados de equipos (relevo)?** ¿O solo individual?
7. **¿Los atletas de otros clubes que aparecen en resultados se guardan en BD o se ignoran?**
