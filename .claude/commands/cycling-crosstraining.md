# /cycling-crosstraining [athlete-id] — Agente de Ciclismo como Cross-Training para Patinadores

Implementa el Agente de Ciclismo y Cross-Training (AG-06) especializado en bicicleta como entrenamiento complementario al patinaje de velocidad.

## Por qué el ciclismo es el cross-training principal del patinaje

El ciclismo es la herramienta de cross-training más usada en el patinaje de velocidad por razones biomecánicas:
- **Patrón motor similar:** posición baja (triple flexión rodilla-cadera-tobillo), empuje cíclico
- **Mismos grupos musculares:** cuádriceps, glúteos, isquiotibiales, pantorrillas
- **Sin impacto:** recuperación activa sin estrés articular
- **Control de intensidad preciso:** potenciómetro o FC, ideal para zonas de entrenamiento
- **Usado por élites colombianos:** entrenadores como los del Club Cali de Cali integran 2-3 sesiones semanales en pista y 1-2 en bicicleta

## Perfil del Agente

Especialista en ciclismo de rendimiento como herramienta de acondicionamiento para patinadores. Equilibra la carga en pista con el trabajo en bicicleta para maximizar adaptaciones cardiovasculares y musculares sin generar fatiga técnica del patinaje.

## Knowledge Base del Agente

### `ciclismo_patinadores.md` — Por qué y cómo integrar la bicicleta
```
Principios clave:
- La bicicleta desarrolla VO2max y potencia aeróbica sin desgastar la técnica del patinaje
- Usar bici en días de RECUPERACIÓN ACTIVA: zona 1-2, 45-60 min, FC < 70% FCmax
- Usar bici para VOLUMEN AERÓBICO en pretemporada: 2-3h en zona 2
- NUNCA programar bici de alta intensidad el día anterior a entrenamiento técnico de pista
- Tipos de bicicleta usados por patinadores:
  * Bicicleta de ruta (road bike): para trabajo de resistencia y fondo
  * Bicicleta fija/rodillo: indoor, control preciso de vatios, ideal invierno o lluvia
  * MTB: terreno irregular fortalece propiocepción, útil en transición
```

### `zonas_entrenamiento_ciclismo.md` — Zonas de potencia y FC
```
Sistema de 5 zonas adaptado de Coggan para patinadores:

Zona 1 — Recuperación activa
  FC: < 60% FCmax | Vatios: < 55% FTP
  Cuándo: día después de competencia, entre sesiones duras
  Descripción: pedaleo suave, sin esfuerzo, oxigenar músculos

Zona 2 — Resistencia aeróbica (BASE)
  FC: 60-75% FCmax | Vatios: 56-75% FTP
  Cuándo: pretemporada, días de volumen, fundamentación aeróbica
  Descripción: conversación posible, "zona de confort de esfuerzo largo"
  Duración típica: 60-180 min
  Clave para patinadores: desarrolla economía de movimiento y mitocondrias

Zona 3 — Tempo / Aeróbico sostenido
  FC: 76-82% FCmax | Vatios: 76-90% FTP
  Cuándo: preparación específica, trabajo de ritmo
  Descripción: esfuerzo controlado pero sostenido, conversación difícil
  Duración típica: 20-60 min continuos o 2x20 min con 5 min descanso

Zona 4 — Umbral anaeróbico (FTP)
  FC: 83-90% FCmax | Vatios: 91-105% FTP
  Cuándo: preparación competitiva, elevar umbral
  Descripción: "comfortably hard", ritmo de contrarreloj
  Duración típica: 10-20 min en intervalos, 4x8 min, 3x10 min
  Para patinadores: equivale a trabajar resistencia de 1500m-3000m

Zona 5 — VO2max / Alta intensidad
  FC: > 90% FCmax | Vatios: > 106% FTP
  Cuándo: preparación competitiva avanzada (NO para categorías escuela/infantil)
  Descripción: esfuerzo máximo sostenido, respiración muy forzada
  Duración típica: 3-8 min por intervalo, 5x4 min, 4x5 min con 3-5 min recuperación
  Para patinadores: desarrolla capacidad para los esfuerzos de 300m-1000m
```

### `sesiones_tipo_ciclismo.md` — Biblioteca de sesiones
```
SESIÓN 1: Recuperación activa (45 min)
- 10 min calentamiento Z1
- 25 min Z1-Z2 suave, cadencia 80-90 rpm
- 10 min vuelta calma Z1
- Cuándo usar: día después de competencia o entrenamiento muy duro

SESIÓN 2: Base aeróbica larga (90-120 min)
- 15 min calentamiento Z1-Z2
- 60-90 min Z2 constante, cadencia 85-95 rpm
- 15 min vuelta calma
- Cuándo usar: sábado o domingo en pretemporada

SESIÓN 3: Tempo 2x20 (75 min total)
- 15 min calentamiento
- 2 x 20 min en Z3 con 5 min Z1 entre bloques
- 15 min vuelta calma
- Cuándo usar: preparación específica, 1-2 veces por semana

SESIÓN 4: Umbral 4x8 (70 min)
- 15 min calentamiento con 3 acelerones de 10 seg
- 4 x 8 min Z4 con 4 min Z1 recuperación activa
- 15 min vuelta calma
- Para patinadores intermedios-avanzados en preparación competitiva

SESIÓN 5: VO2max 5x4 (60 min)
- 15 min calentamiento progresivo con sprints cortos
- 5 x 4 min Z5 con 3 min recuperación completa
- 15 min vuelta calma
- Solo para mayores/juveniles en pico de forma

SESIÓN 6: Pirámide de intervalos (75 min)
- 15 min calentamiento
- 1 min Z5 / 1 min Z1 → 2 min Z4 / 2 min Z1 → 3 min Z4 / 3 min Z1 → 2 min Z4 / 2 min Z1 → 1 min Z5
- Repetir pirámide 2 veces
- 15 min vuelta calma

SESIÓN 7: Sprint sobre fatiga (60 min)
- 20 min Z2-Z3
- 10 sprints de 10-15 seg máximos con 50-60 seg recuperación
- 15 min Z2 resistencia
- 5 min vuelta calma
- Traduce la potencia del gym a velocidad en pista
```

### `tests_evaluacion_ciclismo.md` — Pruebas de rendimiento
```
TEST 1: FTP (Functional Threshold Power) — Test de 20 minutos
- Calentamiento 15 min con 3 esfuerzos de 1 min al 100%
- 5 min recuperación
- 20 min esfuerzo máximo sostenido (registrar potencia media)
- FTP = 95% de la potencia media del test de 20 min
- Repetir cada 6-8 semanas para ajustar zonas
- SIN potenciómetro: usar FC máxima sostenida en los 20 min como referencia de umbral

TEST 2: Test rampante (Ramp Test) — Alternativa menos fatigante
- Empezar en Z1 e incrementar 20W cada minuto
- Continuar hasta el fallo (no poder mantener el watt del minuto)
- FTP estimado = 75% de la potencia máxima del último minuto completado

TEST 3: VO2max estimado con prueba de 6 minutos
- Tras calentamiento: esfuerzo máximo 6 minutos
- VO2max estimado (ml/kg/min) = (potencia_media_6min × 10.8 / peso_kg) + 7

FRECUENCIAS CARDÍACAS DE REFERENCIA (sin potenciómetro):
- FCmax estimada: 220 - edad (jóvenes: menos preciso, usar test de campo)
- FC de umbral anaeróbico ≈ 85-90% FCmax (Conconi) o test de lactato
- FC en Z2 real: la zona donde puedes hablar con frases completas pero no cómodamente
```

### `integracion_calendario_patinaje.md` — Cómo insertar bici en el calendario
```
REGLAS DE INTEGRACIÓN:

1. NUNCA día de alta intensidad en bici + alta intensidad en pista el mismo día
2. Días de competencia o precompetitivo: sin bici (o solo Z1 muy suave)
3. Después de competencia (día siguiente): bici Z1 45 min si hay 3+ días de recuperación

PLANTILLA SEMANAL — Pretemporada (patinador juvenil/mayor):
  Lunes: Pista — técnica (1.5h, baja intensidad)
  Martes: Bici — base Z2 (90 min)
  Miércoles: Pista — velocidad (1.5h, alta intensidad)
  Jueves: Bici — recuperación Z1 o descanso completo
  Viernes: Pista — resistencia (2h, media intensidad)
  Sábado: Bici — largo Z2 (120 min) o Pista (si competencia pronto)
  Domingo: Descanso completo o Pista técnica suave

PLANTILLA SEMANAL — Período competitivo:
  Lunes: Pista — activación post-competencia (técnica suave)
  Martes: Bici — recuperación Z1 (45-60 min)
  Miércoles: Pista — calidad (intervalos)
  Jueves: Bici — tempo Z3 (60 min) o descanso
  Viernes: Pista — precompetitivo (ritmo de carrera)
  Sábado: Competencia
  Domingo: Bici Z1 recuperación o descanso

MENORES DE 14 AÑOS (escuela/infantil):
  - Máximo 45 min en bici
  - Solo Z1 y Z2 (sin trabajo de umbral ni VO2max)
  - Enfoque: disfrute y habilidad de pedaleo, no rendimiento
```

### `lesiones_ciclismo_patinadores.md` — Prevención y adaptación
```
LESIONES COMUNES EN BICICLETA PARA PATINADORES:

1. Dolor anterior de rodilla (síndrome patelofemoral)
   - Causa: sillín muy bajo, carga de cuádriceps excesiva
   - Prevención: ajustar altura sillín (pierna casi extendida en punto muerto inferior)
   - Si persiste: reducir carga, evitar cadencias bajas < 70 rpm

2. Dolor lumbar
   - Causa: posición muy inclinada en road bike
   - Para patinadores: usar bicicleta de montaña o ajustar manillar más alto
   - La posición del patinador ya carga la zona lumbar — no sumar estrés en bici

3. Entumecimiento en manos
   - Causa: apoyo excesivo en manillar
   - Prevención: guantes con relleno, agarrar manillar sin tensión

4. Tendinitis del tendón de Aquiles
   - En patinadores que cambian de calzado rígido (patín) a zapatilla de ciclismo
   - Calentamiento progresivo obligatorio, nunca arrancar en frío en bici

AJUSTE DE BICICLETA (bike fitting básico):
- Altura del sillín: al pedalear en punto muerto inferior, rodilla con 25-35° de flexión
- Retroceso del sillín: rodilla sobre el eje del pedal en posición 3 en punto (3 o'clock)
- Altura de manillar: para patinadores principiantes en bici, manillar a altura del sillín o más alto
```

## Sistema Prompt del Agente
```python
CYCLING_AGENT_SYSTEM_PROMPT = """
Eres un experto en ciclismo de rendimiento especializado en su uso como cross-training
para patinadores de velocidad. Tienes formación en fisiología del ejercicio, biomecánica
del ciclismo y planificación del entrenamiento.

Sabes que el ciclismo es la herramienta complementaria más importante del patinaje por
sus similitudes biomecánicas y la capacidad de desarrollar el sistema aeróbico sin
la fatiga técnica del patinaje.

Cuando respondas:
1. Consulta siempre el calendario de entrenamientos en pista para no generar sobreentrenamiento
2. Adapta la intensidad según la fase de la temporada (más volumen Z2 en pretemporada, más Z4-Z5 en preparación competitiva)
3. Para menores de 14 años: solo Z1-Z2, duración máxima 45-60 min
4. Informa sobre equivalencias entre esfuerzos en bici y en pista para que el entrenador entienda el contexto
5. Siempre priorizar el patinaje: la bici complementa, no compite

Principio fundamental: "La bicicleta construye el motor, el patín lo aplica."
"""
```

## Herramientas (LangChain Tools) del Agente
```python
@tool
def get_weekly_skating_sessions(athlete_id: str) -> list:
    """Obtiene las sesiones de patinaje de la semana para integrar la bici sin sobreentrenamiento"""

@tool
def get_athlete_fc_max(athlete_id: str) -> Optional[int]:
    """Obtiene la FC máxima registrada del atleta para calcular zonas"""

@tool
def get_athlete_ftp(athlete_id: str) -> Optional[float]:
    """Obtiene el FTP registrado del atleta (vatios) si tiene potenciómetro"""

@tool
def create_cycling_session(athlete_id: str, session_data: dict) -> str:
    """Crea una sesión de ciclismo en el calendario del atleta de tipo 'cross_training'"""

@tool
def get_training_load(athlete_id: str, days: int = 7) -> dict:
    """Obtiene la carga de entrenamiento reciente para ajustar la intensidad de la sesión de bici"""
```

## Migración SQL
```sql
-- Agregar tipo 'cross_training' al enum de sesiones de entrenamiento
ALTER TYPE training_type ADD VALUE IF NOT EXISTS 'cross_training';

-- Tabla de perfil de ciclismo del atleta
CREATE TABLE IF NOT EXISTS athlete_cycling_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE UNIQUE,
  ftp_watts INTEGER,              -- Potencia umbral funcional (vatios)
  fc_max INTEGER,                 -- FC máxima registrada
  fc_threshold INTEGER,           -- FC en umbral anaeróbico
  has_power_meter BOOLEAN DEFAULT FALSE,
  bike_type TEXT,                 -- 'road', 'mtb', 'fixed', 'stationary'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test de FTP registrado con fecha
CREATE TABLE IF NOT EXISTS cycling_ftp_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  ftp_watts INTEGER,
  test_type TEXT DEFAULT '20min', -- '20min', 'ramp', '6min'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## UI — `src/components/agents/CyclingCrossTrainingView.tsx`
- Perfil del atleta en bici (FTP, FCmax, tipo de bici, ¿tiene potenciómetro?)
- Calendario semanal de patinaje ya cargado automáticamente
- Objetivo de la sesión: recuperación / aeróbico / umbral / VO2max
- Duración disponible (minutos)
- Botón "Sugerir sesión de bici"
- Vista de la sesión generada:
  - Calentamiento / Bloques principales / Vuelta calma
  - Zonas de FC o vatios por bloque
  - Cadencia objetivo
  - Notas de ejecución
- Botón "Agregar al calendario"
- Historial de sesiones de bici con gráfica de tendencia de FTP

## Integración con Dashboard Coach
En `CoachDashboard.tsx` → Tab "Cross-Training":
- Vista semanal de sesiones de bici de todos los atletas
- Alerta si algún atleta tiene demasiado volumen total (bici + pista)
- Botón "Planificar semana de cross-training" para el grupo

## Ejemplos de consultas al agente
```
"El miércoles tengo entrenamiento duro en pista, ¿qué hago en bici el martes?"
"Dame una sesión de recuperación activa en bici para después de la competencia de ayer"
"Tengo 90 minutos para bici, estamos en pretemporada, ¿qué hago?"
"¿Cómo calculo mis zonas de entrenamiento sin potenciómetro?"
"María tiene competencia en 2 semanas y su FTP bajó 10W, ¿cómo ajusto su plan de bici?"
"¿Es mejor hacer bici de ruta o rodillo para los patinadores en época de lluvia?"
"El grupo infantil quiere aprender a usar la bici, ¿cómo los inicio?"
```
