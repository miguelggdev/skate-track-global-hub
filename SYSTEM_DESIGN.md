# SYSTEM DESIGN — SpeedSkateTrack Hub
## Análisis de requerimientos y flujo de información
*Actualizado: Validado con el usuario — decisiones de diseño confirmadas*

---

## DECISIONES DE DISEÑO CONFIRMADAS

| Decisión | Definición |
|---|---|
| **Reglamento** | World Skate (WS) — Speed Skating rulebook oficial |
| **Puntos acumulados** | Sí, en categorías: Prejuvenil, Juvenil, Mayores — usados para ligas/escalafón |
| **Escalafón** | Calculado de forma diferente a la suma directa de puntos de prueba |
| **Dorsal/bib** | Diferente por evento — no fijo por atleta |
| **Resultados incluyen** | Nombre + Tiempo + Puntos (solo en pruebas de puntos) |
| **Atletas de otros clubes** | Se guardan en BD + dashboard separado filtrable por club |
| **Relevos** | Sí — 3 del mismo equipo o el juez los organiza |
| **Quién importa resultados** | Solo el Administrador |
| **RAG disponible para** | Atletas, entrenadores, padres/acudientes |

---

## 1. FLUJO DE INFORMACIÓN DEL SISTEMA

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
│  → Entrenadores (con perfil profesional y licencia WS)      │
│  → Delegados de competencia                                 │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: REGISTRAR DEPORTISTAS (del club)                   │
│  → Datos personales + categoría (auto por fecha nacimiento) │
│  → Categorías: Prejuvenil | Juvenil | Junior | Senior | Master│
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
│  → Tipo: Distrital | Departamental | Nacional | Panamericano│
│  → Definir pruebas: 300m CRI, 500m CRI, 1000m, 3km, 5km... │
│  → Asignar dorsales por evento (cambian en cada competencia)│
│  → Inscribir atletas del club por prueba                    │
│  → CARGAR RESULTADOS (OCR desde PDF/imagen — solo Admin)    │
│    → Atletas propios: match automático + record personal    │
│    → Atletas externos: se crean como "externos" en BD       │
│    → Relevos: 3 atletas por equipo (mismo club o mixto)     │
│  → Generar medallería 🥇🥈🥉                                │
│  → Actualizar puntos de liga (Prejuvenil/Juvenil/Mayores)  │
│  → Actualizar escalafón (fórmula diferente a puntos de prueba)│
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 6: FINANZAS                                           │
│  → Generar cobros de mensualidad por categoría              │
│  → Registrar pagos con recibo numerado automático           │
│  → Alertas de mora (+30 días)                               │
│  → Cartas de permiso (PDF) para competencias con QR         │
│  → Carnets del club con QR                                  │
│  → Exportar Excel de pagos y morosos                        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 7: DASHBOARDS POR ROL + CHATBOTS IA                  │
│  → Admin: métricas globales + todos los módulos             │
│  → Entrenador: mis atletas + asistencia + KPIs + tiempos    │
│  → Atleta: mi perfil + mis tiempos + ranking + pagos        │
│  → Financiero: pagos + mora + recibos + reportes            │
│  → Delegado: competencias + inscripciones + resultados      │
│  → Líder: reportes ejecutivos + visión estratégica          │
│                                                             │
│  CHATBOTS DISPONIBLES EN TODOS LOS ROLES:                  │
│  → 🤖 Reglamento WS (RAG): "¿Qué dice el art. 47 de WS?"  │
│  → 🤖 Consultas BD: "¿Cuál es mi mejor tiempo en 500m CRI?"│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. MÓDULO DE CARGA DE RESULTADOS (OCR + IA)

### Formatos de entrada confirmados
1. **PDF oficial World Skate / Fedepatin** — Nacionales, Panamericanos, Mundiales
2. **PDF/imagen de Distritales Bogotá** — Resoluciones por categoría y etapa
3. **Imagen fotográfica** — Foto del tablero de resultados o resolución impresa

### Campos a extraer según formato confirmado

```
ENCABEZADO (metadatos del evento):
├── Nombre de la competencia
├── Organizador (Fedepatin / Liga Bogotá / World Skate)
├── Fecha y sede
├── Prueba (300m CRI | 500m CRI | 1000m | 3km | 5km | 10km | maraton | relevo)
├── Categoría (Prejuvenil | Juvenil | Junior | Senior | Master)
└── Género (Masculino | Femenino)

RESULTADOS POR FILA:
├── Posición
├── Número dorsal (diferente por evento)
├── Nombre completo del atleta
├── Club o país (para internacionales)
├── Tiempo (formato: mm:ss.cc)
├── Diferencia con el primero (+0.35)
├── Puntos de la prueba (solo en pruebas de puntos, no en todas)
└── Estado: Normal | DSQ | DNS | DNF

PARA RELEVOS:
├── Posición del equipo
├── Club/equipo
├── Lista de atletas que corrieron
├── Tiempo total
└── Puntos del equipo
```

### Flujo de importación

```
Admin sube PDF o imagen
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend — Paso 1: Subida                              │
│  • Seleccionar competencia existente (o crear nueva)    │
│  • Subir archivo (PDF o imagen)                         │
│  • Indica si es resultado individual o relevo           │
└──────────────────────────┬──────────────────────────────┘
                           │ POST /api/results/extract
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Python (FastAPI)                               │
│                                                         │
│  Si PDF:  pdfplumber → texto crudo                      │
│  Si imagen: Claude Vision API → descripción + tabla     │
│                                                         │
│  Claude claude-sonnet-4-6 extrae JSON estructurado:               │
│  {                                                      │
│    "competition_name": "...",                           │
│    "date": "2025-08-15",                               │
│    "venue": "Parque El Tunal, Bogotá",                  │
│    "event_type": "500m_cri",                            │
│    "category": "juvenil",                              │
│    "gender": "femenino",                               │
│    "is_relay": false,                                   │
│    "results": [                                         │
│      {                                                  │
│        "pos": 1, "bib": "023",                          │
│        "name": "María García López",                    │
│        "club": "Club Rionegro",                         │
│        "time": "42.350",  // en segundos               │
│        "diff": "+0.000",                                │
│        "points": 34,      // null si no aplica         │
│        "status": "normal" // DSQ | DNS | DNF           │
│      }                                                  │
│    ]                                                    │
│  }                                                      │
│                                                         │
│  Fuzzy match nombres vs athletes en BD:                 │
│  • Score > 0.9 → ✅ Match exacto                        │
│  • Score 0.7-0.9 → ⚠️ Match probable (mostrar opciones)│
│  • Score < 0.7 → ❌ Externo (crear como atleta externo) │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend — Paso 2: Validación                          │
│                                                         │
│  ┌─ Evento detectado ────────────────────────────────┐  │
│  │ Prueba: 500m CRI  │ Cat: Juvenil F  │ Fecha: ...  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Pos │ Dorsal │ Nombre detectado   │ Match BD  │ Tiempo │
│   1  │  023   │ María García López │ ✅ Exacto  │ 42.35  │
│   2  │  041   │ Ana Martínez C.    │ ⚠️ Similar │ 43.12  │
│   3  │  007   │ Sofia Rodríguez    │ ❌ Externo │ 43.89  │
│   -  │  015   │ Luis Pérez         │ ❌ Externo │  DSQ   │
│                                                         │
│  Para ⚠️: dropdown para seleccionar atleta correcto    │
│  Para ❌: badge "Externo" — se guarda como atleta ext. │
│  Cada fila: [✓ Incluir] [✗ Excluir]                   │
│                                                         │
│            [← Volver]  [✅ Confirmar e Importar]       │
└──────────────────────────┬──────────────────────────────┘
                           │ POST /api/results/confirm
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase — Escritura atómica (todo o nada)             │
│                                                         │
│  1. result_imports → trazabilidad del archivo           │
│  2. external_athletes → atletas de otros clubes         │
│  3. competition_results → pos, tiempo, puntos, atleta   │
│  4. time_records → nuevo récord personal si aplica      │
│  5. awards → medallas (pos 1,2,3)                       │
│  6. league_standings → actualizar puntos si es liga     │
│  7. relay_results → si es relevo                        │
│  8. audit_log → trazabilidad de la importación          │
└─────────────────────────────────────────────────────────┘
```

### Casos especiales
- **DSQ/DNS/DNF** — se guardan con ese estado, no afectan ranking ni tiempos
- **Misma competencia importada dos veces** — sistema detecta y advierte
- **Atleta del club no encontrado** — se puede crear inline o marcar como externo
- **Relevo con atletas mixtos** — el juez los define, se registra la combinación tal cual

---

## 3. MODELO DE ATLETAS EXTERNOS

Los resultados de otros clubes se guardan para poder mostrar contexto de rendimiento.

```
external_athletes
├── id
├── full_name          -- nombre exacto del resultado
├── club_name          -- nombre del club tal como aparece
├── category           -- categoría en la que compitió
├── gender
├── country            -- Colombia por defecto, diferente en internacionales
├── created_at

-- Sus resultados van en las mismas tablas:
competition_results.athlete_id → NULL si externo
competition_results.external_athlete_id → FK a external_athletes

-- Relevo
relay_team_members → puede mezclar athletes + external_athletes
```

### Dashboard de resultados por club (público/admin)

```
Filtros:
  [Club ▼] [Temporada ▼] [Categoría ▼] [Prueba ▼]

Tabla:
  Atleta | Club | Prueba | Mejor tiempo | Competencias | Posición típica

Click en atleta → historial de tiempos en esa prueba a lo largo del tiempo
```

---

## 4. SISTEMA DE PUNTOS, LIGAS Y ESCALAFÓN

### Diferencia entre puntos de prueba y escalafón (CONFIRMADO)

```
PUNTOS DE PRUEBA:
├── Se obtienen por posición en una prueba específica
├── Tabla configurable: 1° = 34pts, 2° = 21pts, 3° = 13pts...
├── Solo aplica en pruebas designadas (no en todas)
└── Se usan para calcular posición dentro de una competencia con múltiples pruebas

ESCALAFÓN:
├── Fórmula diferente — no es suma directa de puntos de prueba
├── Considera: número de competencias, mejores tiempos, categoría de evento
├── Calculado por la liga o federación con su propia lógica
└── El sistema lo calcula y permite exportar para validación con Fedepatin

LIGAS (Copa/Torneo con múltiples etapas):
├── Aplica en: Prejuvenil, Juvenil, Mayores
├── Liga = conjunto de competencias en una temporada
├── Al final de cada etapa se acumulan puntos en league_standings
└── Clasificatorio para Distritales → Departamental → Nacional
```

### Tablas de puntos (configurables por admin)

```
Tipo: "Copa Bogotá 2025 — Pruebas de puntos"
Pos 1 → 34 pts
Pos 2 → 21 pts
Pos 3 → 13 pts
Pos 4 →  8 pts
Pos 5 →  5 pts
Pos 6 →  3 pts
Pos 7 →  2 pts
Pos 8 →  1 pt
```

---

## 5. RELEVOS

```
FORMACIÓN DE EQUIPOS (confirmado):
├── 3 atletas del mismo club forman un equipo automáticamente
├── O el juez en competencia los organiza a criterio propio
└── Pueden ser mixtos (definidos por el juez)

REGISTRO EN BD:
├── relay_teams: (id, competition_id, event_id, team_name, club_name)
├── relay_team_members: (relay_team_id, athlete_id | external_athlete_id, orden)
├── relay_results: (relay_team_id, pos, time, points, status)
└── Las medallas van al equipo, no individualmente (salvo definición del club)
```

---

## 6. RAG — CHATBOT WORLD SKATE RULES

### Fuente oficial
- **Documento**: World Skate Speed Skating Rules (último año disponible)
- **Cobertura**: Todas las disciplinas (pista, maratón, CRI, relevo)
- **Actualización**: Cuando World Skate publique nueva versión

### Disponibilidad por rol

| Rol | Acceso al chatbot WS | Acceso al chatbot BD |
|---|---|---|
| Admin | ✅ Reglamento | ✅ Todo |
| Entrenador | ✅ Reglamento | ✅ Sus atletas |
| Atleta | ✅ Reglamento | ✅ Solo sus datos |
| Padre/Acudiente | ✅ Reglamento | ✅ Datos de su hijo |
| Financiero | ✅ Reglamento | ✅ Solo finanzas |
| Delegado | ✅ Reglamento | ✅ Competencias |

### Preguntas típicas que debe responder

```
"¿Cuál es la distancia de la zona de calentamiento en una CRI?"
"¿Qué artículo define las sanciones por salida falsa?"
"¿Cuántos atletas puede inscribir un club por prueba en Panamericanos?"
"¿Qué documentos necesita un Prejuvenil para competir en Nacionales?"
"¿Cómo se calcula el puntaje en la prueba de puntos de 5km?"
"¿Qué pasa si un juez de salida comete un error?"
```

---

## 7. SCHEMA — TABLAS NUEVAS CONFIRMADAS

```sql
-- Atletas externos (otros clubes, países)
external_athletes (
  id, full_name, club_name, category, gender, 
  country DEFAULT 'Colombia', notes, created_at
)

-- Trazabilidad de importaciones
result_imports (
  id, competition_id, file_url, file_type (pdf|image),
  imported_by, status (pending|validated|imported|failed),
  raw_extracted jsonb,   -- texto/JSON extraído por IA
  validated_data jsonb,  -- datos confirmados por admin
  error_log jsonb,
  created_at, completed_at
)

-- Relevos — equipos
relay_teams (
  id, competition_id, event_id, team_name, club_name, created_at
)
relay_team_members (
  id, relay_team_id,
  athlete_id,          -- NULL si externo
  external_athlete_id, -- NULL si del club
  leg_order            -- 1ro, 2do, 3ro que corre
)
relay_results (
  id, relay_team_id, position, time_seconds numeric,
  points integer, status (normal|dsq|dns|dnf), created_at
)

-- Ligas / torneos con puntos acumulados
leagues (
  id, name, season_year, organizer,
  categories athlete_category[],
  start_date, end_date, is_active, created_at
)
league_stages (
  id, league_id, competition_id, stage_number, stage_name
)
league_standings (
  id, league_id, 
  athlete_id,          -- NULL si externo
  external_athlete_id,
  category, total_points, position,
  updated_at
)

-- Tabla de puntos configurable por admin
point_tables (
  id, name, competition_type, season_year,
  points_config jsonb,  -- {1: 34, 2: 21, 3: 13, ...}
  is_active, created_at
)

-- Resoluciones y actas oficiales
competition_resolutions (
  id, competition_id, document_url,
  resolution_number, resolution_type (resultado|sancion|protesta|acta),
  issued_by, issued_at, notes, created_at
)
```

---

## 8. DOCUMENTOS A COMPARTIR

Copia los archivos en:
```
proyecto/docs/
├── world_skate_rules.pdf          ← Reglamento WS (para RAG)
├── resultados_distritales_*.pdf   ← Ejemplo resultado Bogotá
├── resultados_fedepatin_*.pdf     ← Ejemplo resultado nacional
├── puntuacion_liga_*.pdf          ← Tabla de puntos de liga
└── planilla_inscripcion_*.pdf     ← Si tienes planillas
```

Las **imágenes** las puedes arrastrar directamente al chat.

---

## 9. ORDEN DE IMPLEMENTACIÓN ACTUALIZADO

### Sprint 1 (completar): DB + tipos de datos
1. ✅ Schema base (migración 001)
2. ✅ Expansión completa (migración 002)
3. ✅ Tablas legacy (migración 003)
4. ✅ Audit log + pgvector (migración 004)
5. ✅ Storage policies (migración 004b)
6. **SIGUIENTE**: Migración de tablas confirmadas (external_athletes, leagues, relay_teams, result_imports, point_tables, competition_resolutions)

### Sprint 2: Backend Python
1. FastAPI setup + Supabase client
2. Endpoint OCR de resultados (Claude Vision)
3. Script indexación reglamento WS → knowledge_base
4. AG-11 Normativa (RAG reglamento)
5. AG-01 Admin (consultas BD en lenguaje natural)
6. AG-10 Resultados (extractor OCR con validación)

### Sprint 3+: Frontend módulos
1. Calendario por categoría
2. UI importación de resultados (upload → validación → confirm)
3. Dashboard "Resultados por club" (atletas externos)
4. Chat UI para los agentes
5. Módulo de ligas y escalafón
