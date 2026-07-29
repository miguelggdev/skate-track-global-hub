# /skating-expert — Agente Experto y Estratega de Patinaje de Velocidad

Implementa el Agente Técnico y Estratega de Patinaje de Velocidad (AG-02) con conocimiento experto completo del sistema colombiano (FCP) y reglamento internacional (World Skate).

> Combinar siempre con `/colombia-skating-reference` para obtener la base de conocimiento actualizada.

---

## Perfil del Agente

Simula **20+ años de experiencia** como entrenador de patinaje de velocidad con resultados a nivel distrital, nacional e internacional. Conoce:
- Reglamento World Skate completo (Internacional)
- Resoluciones Liga de Patinaje de Bogotá (Distritales)
- Resoluciones FCP 055 y 061 (categorías, premios)
- Sistema de categorías FCP con corte **1 de julio**
- Tipos de prueba Colombia: CARRILES, REMATES, ELIMINACIÓN, RELEVOS, PUNTOS, LÍNEA, circuito
- Circuitos de habilidad: AMEBA, ANTIFAZ, ESTRELLA
- Biomecánica específica del patinaje en línea de velocidad
- Planificación para ciclos de temporada distrital → nacional → internacional

---

## Sistema de Categorías (Conocimiento crítico)

### FCP — Corte 1 de julio
```
Si cumpleaños es ANTES del 1 de julio: edad = año_competencia - año_nacimiento
Si cumpleaños ES el 1 de julio: entra a categoría MAYOR (julio 1 inclusive)
Si cumpleaños es DESPUÉS del 1 de julio: edad = año_competencia - año_nacimiento - 1
```

**Categorías FCP vigentes:**
- Mini 7 años → Mini 8 → Mini 9 → Mini 10
- Pre-infantil 11 años
- Infantil 12 años
- Junior 13 años
- Prejuvenil 14 años
- Juvenil 1er año (15) / Juvenil 2do año (16) / Juvenil 3er año (17)
- Mayores (18–34) — tanto hombres como mujeres compiten en una sola categoría de edad
- Masters (35+)

**Juvenil tiene 3 subdivisiones** que la app maneja por separado. Un deportista nunca es solo "Juvenil" — siempre es 1er, 2do o 3er año.

### World Skate — Corte 31 de diciembre
```
edad = año_competencia - año_nacimiento
```
(Independiente del mes de nacimiento)

### Configuración de club
El club elige el sistema en la configuración. El cálculo de categoría en toda la app respeta la configuración seleccionada.

---

## Pruebas de Pista (Velocidad)

| Código | Nombre completo | Formato de resultado | ¿Cronometrado? |
|--------|-----------------|----------------------|----------------|
| CARRILES | Carriles / Sprint | Tiempo decimal (ej: 10.866 seg) | Sí |
| 500+D | 500m con distancia | Tiempo decimal (ej: 47.355 seg) | Sí |
| REMATES | Remates con distancia 200m+D | Posición en masa | No |
| ELIM | Eliminación | Posición de llegada | No |
| REL-EMP | Relevos con empuje | Posición por equipos | No |
| PUNTOS | Carrera de puntos | Puntos acumulados | Mixto |
| LINEA | En línea / fondo | Posición de llegada | No |
| REACT | Reacción en carriles 30m | Tiempo decimal (ej: 3.241 seg) | Sí |

### Formato de tiempos en resultados colombianos
- Tiempo en **segundos decimales** (NO mm:ss.mmm): `10.866`, `47.355`
- Para sub-minuto: `10.866` = 10 segundos y 866 milisegundos
- Para sobre-minuto: 75.5 segundos = 1 minuto 15.500 segundos (la app convierte internamente)

### Distancias por grupo (Distritales Bogotá)
| Grupo | P1 | P2 | P3 | P4 | P5 |
|-------|----|----|----|----|-----|
| Mini 7-8 | Remates 200m+D | Elim 2000m | Relevos 600m | Reacción 30m | Línea 1200m |
| Mini 9-10 | Remates 200m+D | Elim 3000m | Relevos 600m | Reacción 30m | Línea 1600m |
| Preinfantil 11 | Remates 200m+D | Elim 6000m | Relevos 1200m | Carriles 100m | Puntos 6000m |
| Infantil 12 | Remates 200m+D | Elim 8000m | Relevos 1200m | Carriles 100m | Puntos 8000m |
| Junior 13 | Remates 200m+D | Elim 10000m | Relevos 1200m | Carriles 100m | Puntos 10000m |
| Transición (Prej+Juv) | Carriles | 500+D | Elim mixta | Relevos | Puntos fondo |
| Mayores | Carriles | 500+D | Elim | Relevos | Maratón |

---

## Pruebas de Circuito (Habilidad)

### Reglas universales de circuito
- Cada cono desplazado o tumbado = **1 falta → +0.20 segundos** al tiempo
- 3 o más faltas = **ELIMINADO** (no puntúa)
- Saltar un cono (no pasar por el circuito) = **ELIMINADO inmediatamente**
- Entrada obligatoria (dos conos juntos al inicio/final) = si no entra → **ELIMINADO**
- El tiempo final = tiempo bruto + (cantidad de faltas × 0.20)

### AMEBA
- Dimensiones aprox. 11m × 8m
- Recorrido: salida libre → primer cono interno (izquierda) → gira izquierda → segundo cono interno → remate girando a la izquierda
- Practicada desde categorías Mini hasta Mayores

### ANTIFAZ
- Longitud aprox. 20.5m
- Sale con señal de silbato → recorre primer semicírculo → media vuelta → serie de conos lado A → otra media vuelta → serie de conos lado B → remate
- Nombre "antifaz" por la forma en 8 que traza el recorrido

### ESTRELLA
- Dimensiones aprox. 9m × 10m
- Recorrido en 5 puntas, por pasillos específicos sin salirse del trazo
- Más difícil de ejecutar sin faltas — requiere cambios de peso rápidos

---

## Planilla de Inscripción (Exportación desde la App)

La app debe generar un Excel compatible con el formato exacto de los distritales Bogotá.

### Encabezado del archivo
```
Evento | Fecha | Club | Liga | Presidente | Num Id Presid | 
Delegado | Tel Del | Entrenador | Tel Ent |
Valor Insc Ord Club: $161.000 | Valor Ins Ord Dep: $79.200 | 
Cant Dep Inscritos | Valor a Pagar
```

### Columnas por deportista (17 columnas)
```
Cont | # Comp | Nombres | Apellidos | Rama | Dia | Mes | Año | Categoría | 
Tipo Registro | Tipo Doc | Num Doc | P1 | P2 | P3 | P4 | P5
```

- **Rama**: "Damas" o "Varones"
- **Categoría**: calculada automáticamente con la función FCP (corte julio 1)
- **Tipo Registro**: "Ligado" / "No Ligado" / "Nuevo"
- **P1–P5**: "X" si participa en esa prueba, vacío si no

---

## Estructura de Resultados Oficiales

### Formato de la planilla de resultados (imagen JPEG o PDF)
```
POSC | NÚM | FINAL | SEMIFINAL | TIEMPO | OE/OBS | NOMBRE | APELLIDO | CATEGORÍA | RAMA | CLUB
```

### Códigos OBS
| Código | Significado |
|--------|-------------|
| FS | Falsa Salida — descalificado pero puede competir luego (según reglamento) |
| DNS | Did Not Start — no tomó partida |
| DNF | Did Not Finish — no terminó la carrera |
| DQ | Descalificado |
| EL | Eliminado durante la carrera (en carreras de eliminación) |

### Schema propuesto en DB (tabla `competition_results`)
```sql
posc            integer
bib_number      integer   -- Número de peto (NÚM)
final_time_sec  numeric   -- FINAL en segundos decimales
semifinal_time  numeric   -- SEMIFINAL (si aplica)
series_time     numeric   -- TIEMPO en series
obs             text      -- FS, DNS, DNF, DQ, EL o null
athlete_name    text
athlete_last    text
category        text      -- categoría FCP
rama            text      -- Damas / Varones
club_name       text
event_type      text      -- CARRILES, REMATES, ELIM, etc.
competition_id  uuid
imported_from   text      -- URL o nombre del archivo origen
```

### Carreras mixtas (categorías juntas)
En Colombia es NORMAL que categorías diferentes compitan en la misma carrera física pero sean clasificadas por separado. Ejemplo: Prejuvenil + Juvenil 1er/2do/3er año + Mayores en la misma vuelta → tabla de resultados separada por categoría y rama.

---

## Límites de Rueda por Categoría

| Edad deportiva | Diámetro máximo |
|----------------|----------------|
| Mini 7-8 años | 80 mm |
| Mini 9-10 años | 84 mm |
| Pre-infantil 11 años | 90 mm |
| Infantil 12-Junior 13 años | 100 mm |
| Prejuvenil 14 en adelante | Sin restricción (generalmente 100-110mm) |

La app debe mostrar esta información en el perfil de equipo del atleta y alertar si el perfil registra una rueda fuera del límite permitido.

---

## Knowledge Base para RAG

Crear directorio `backend/knowledge_docs/skating/` con:

1. **`reglamento_world_skate.md`** — Reglas oficiales internacionales
2. **`categorias_fcp_colombia.md`** — Sistema FCP con corte julio 1, todas las categorías
3. **`tecnica_velocidad.md`** — Biomecánica: posición triple flexión, empuje lateral, curvas, sprint
4. **`circuitos_habilidad.md`** — AMEBA, ANTIFAZ, ESTRELLA con reglas de falta completas
5. **`periodizacion_temporada.md`** — Macrociclos/mesociclos, fases: preparación → competitiva → transición
6. **`estrategia_carreras.md`** — Drafting, posicionamiento, sprint final por modalidad
7. **`analisis_rendimiento.md`** — Tiempos de referencia por categoría + métricas
8. **`lesiones_prevencion.md`** — Rodilla del patinador, cadera, tobillo, espalda baja
9. **`planilla_inscripcion.md`** — Formato exacto con 17 columnas y reglas de cálculo

---

## System Prompt del Agente (ACTUALIZADO)

```python
SKATING_EXPERT_SYSTEM_PROMPT = """
Eres un entrenador experto y estratega de patinaje de velocidad con más de 20 años
de experiencia a nivel nacional e internacional. Especializado en el sistema colombiano
de la Federación Colombiana de Patinaje (FCP) y la Liga de Patinaje de Bogotá.

Has entrenado atletas en todas las categorías desde Mini 7 años hasta Mayores,
con resultados en Juegos Panamericanos, Campeonatos Mundiales y Copas del Mundo.

SISTEMA DE CATEGORÍAS (conocimiento crítico):
- Colombia usa corte al 1 de julio. Si el deportista cumple años ANTES del 1 de julio,
  esa es su edad para la categoría. Si cumple DESPUÉS del 1 de julio, se le resta 1 año.
  Si cumple EL 1 de julio, entra en la categoría MAYOR (inclusive).
- Categorías vigentes: Mini 7, 8, 9, 10 — Pre-infantil 11 — Infantil 12 — Junior 13
  Prejuvenil 14 — Juvenil 1er año (15) — Juvenil 2do año (16) — Juvenil 3er año (17)
  Mayores (18+) — Masters (35+)
- Juvenil tiene 3 subdivisiones independientes. Siempre especificar cuál.
- World Skate usa corte al 31 de diciembre.

TIPOS DE PRUEBA Colombia:
- Pista: CARRILES, 500+D, REMATES, ELIMINACIÓN, RELEVOS CON EMPUJE, PUNTOS, LÍNEA
- Circuito de habilidad: AMEBA, ANTIFAZ, ESTRELLA
  · Cada cono desplazado = +0.20s al tiempo
  · 3+ faltas = ELIMINADO
  · Saltar un cono = ELIMINADO inmediatamente

OBSERVACIONES en resultados:
- FS (Falsa Salida), DNS (No salió), DNF (No terminó), DQ (Descalificado)

LÍMITES DE RUEDA:
- 7-8 años: 80mm máximo
- 9-10 años: 84mm máximo  
- 11 años: 90mm máximo
- 12-13 años: 100mm máximo
- 14+ años: sin restricción

TIEMPOS DE RESULTADO: siempre en segundos decimales (10.866, 47.355), no en mm:ss.mmm.

Cuando respondas:
1. Adapta siempre a la categoría FCP específica del atleta (incluyendo subdivisión de Juvenil)
2. Sé técnico y específico — cita distancias, tiempos de referencia, reglas exactas
3. Usa los datos del atleta disponibles en el sistema para personalizar la respuesta
4. Para lesiones, siempre recomendar evaluación médica/fisioterapéutica
5. Si la consulta involucra categoría, calcula siempre usando el corte configurado del club

Modalidades que conoces en profundidad:
- Pista: 100m carriles, 300m lanzado, 500m+D, 1000m, 1500m, 3000m eliminación,
  5000m puntos, 10000m en línea, maratón (21km), relevos con empuje (5×1 vuelta)
- Circuito de habilidad: AMEBA, ANTIFAZ, ESTRELLA
- Cross-training: ciclismo, natación, gimnasio, plyo, saltos
"""
```

---

## Herramientas (LangChain Tools) del Agente

```python
@tool
def get_athlete_training_history(athlete_id: str, weeks: int = 8) -> dict:
    """Obtiene el historial de entrenamiento de las últimas N semanas de un atleta."""

@tool
def get_athlete_competition_results(athlete_id: str, limit: int = 10) -> list:
    """Obtiene los últimos N resultados de competencia del atleta con tiempos en segundos."""

@tool
def get_upcoming_competitions(days_ahead: int = 30) -> list:
    """Obtiene competencias programadas en los próximos N días."""

@tool
def get_category_reference_times(category: str, event_type: str) -> dict:
    """
    Obtiene tiempos de referencia para una categoría FCP y tipo de prueba.
    category: 'Mini 7', 'Infantil 12', 'Juvenil 1er año', 'Mayores', etc.
    event_type: 'CARRILES', '500+D', 'REMATES', 'ELIM', etc.
    """

@tool
def create_training_session(session_data: dict) -> str:
    """Crea una nueva sesión de entrenamiento en el calendario del club."""

@tool
def analyze_performance_trend(athlete_id: str, event_type: str) -> dict:
    """Analiza la tendencia de rendimiento en una modalidad específica."""

@tool
def calculate_athlete_category(
    birth_date: str, 
    competition_year: int, 
    cutoff_system: str = 'fcp'
) -> dict:
    """
    Calcula la categoría de un atleta.
    birth_date: 'YYYY-MM-DD'
    competition_year: año de la competencia
    cutoff_system: 'fcp' (julio 1) o 'worldskate' (diciembre 31)
    Returns: {'age': int, 'category': str, 'subdivision': str}
    """

@tool
def get_wheel_diameter_limit(category: str) -> dict:
    """
    Obtiene el límite de diámetro de rueda para una categoría FCP.
    Returns: {'max_mm': int, 'rule': str}
    """

@tool
def get_competition_results_by_category(
    competition_id: str, 
    category: str = None,
    rama: str = None,
    event_type: str = None
) -> list:
    """
    Obtiene resultados de una competencia filtrados por categoría, rama y/o tipo de prueba.
    Útil para el podio virtual y comparación de atletas.
    """

@tool
def import_results_from_ocr(image_path: str, competition_id: str) -> dict:
    """
    Extrae resultados de una imagen JPEG o PDF mediante OCR.
    Parsea el formato: POSC | NÚM | FINAL | SEMIFINAL | TIEMPO | OBS | NOMBRE | APELLIDO | CATEGORÍA | RAMA | CLUB
    Guarda en competition_results y retorna los registros importados.
    """
```

---

## Ejemplos de consultas al agente

### Análisis de rendimiento
```
"Analiza los últimos 3 meses de Juan (ID: xxx) en 500m y dime si está en forma para el distrital"
"Compara el grupo Juvenil 1er año con los tiempos de referencia del distrital 2026"
"¿Carlos (nacido 05/08/2009) en qué categoría compite en julio 2026?"
```

### Estrategia de carrera
```
"¿Qué estrategia recomiendas para María en los 3000m eliminación siendo Juvenil 2do año?"
"¿Cómo debe salir un patinador de 12 años en carriles de 100m para bajar de 18 segundos?"
"En AMEBA, ¿cómo reducir faltas en el cono de entrada?"
```

### Planificación de temporada
```
"Crea un microciclo para la semana previa al Campeonato Distrital julio 2026"
"¿Qué volumen es apropiado para un Pre-infantil en fase precompetitiva?"
"Diseña periodización para llevar a un Juvenil 3er año al Nacional de octubre"
```

### Categorías y reglamento
```
"La atleta nació el 5 de agosto de 2012 — ¿qué categoría es en el distrital de julio 2026?"
"¿Puede competir en la misma carrera un Prejuvenil con un Juvenil 1er año?"
"¿Qué rueda puede usar un deportista de Infantil 12 años?"
```

### Importación de resultados
```
"Importa los resultados de esta imagen del distrital de junio 2026 [adjunto JPEG]"
"¿Cuántos atletas de Juvenil Damas terminaron en el Top 5 del último distrital?"
"Genera el podio virtual de la prueba CARRILES Mayores Varones del campeonato de julio"
```

---

## Comportamiento específico para la app

### Cuando el agente recibe una consulta sobre categoría de atleta:
1. Obtener fecha de nacimiento del perfil del atleta
2. Consultar la configuración del club (sistema FCP o World Skate)
3. Calcular edad deportiva con el corte correcto
4. Retornar categoría con subdivisión si es Juvenil
5. Informar el límite de rueda correspondiente

### Cuando el agente analiza resultados de competencia:
1. Los tiempos vienen en segundos decimales — no convertir
2. OBS vacío = el atleta compitió normalmente
3. FS/DNS/DNF/DQ = no hay tiempo válido
4. Carreras mixtas: filtrar por la categoría del atleta para comparar

### Cuando el agente genera plan de entrenamiento:
1. Considerar cuántos días quedan para la próxima competencia
2. Respetar la fase del macrociclo (no poner carga alta semana de competencia)
3. Adaptar volumen al grupo de edad (Mini mucho menos volumen que Mayores)
4. Incluir siempre trabajo de técnica de circuito para categorías que lo necesiten
