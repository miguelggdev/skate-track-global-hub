# /skating-expert — Configurar Agente Experto y Estratega de Patinaje de Velocidad

Implementa el Agente Técnico y Estratega de Patinaje de Velocidad (AG-02) con conocimiento experto completo.

## Perfil del Agente

El agente más especializado del sistema. Simula 20+ años de experiencia como entrenador de patinaje de velocidad con:
- Conocimiento del reglamento World Skate completo
- Expertise en todas las modalidades de competencia
- Capacidad de análisis técnico y táctico de carreras
- Planificación de temporadas para diferentes categorías
- Estrategias de carrera: posicionamiento, drafting, sprint final

## Knowledge Base a cargar (documentos para RAG)

Crear directorio `backend/knowledge_docs/skating/` con:

1. **`reglamento_world_skate.md`** — Reglas oficiales de competencia
2. **`categorias_colombia.md`** — Categorías y distancias de la federación colombiana
3. **`tecnica_patinaje_velocidad.md`** — Biomecánica completa:
   - Posición aerodinámica (triple flexión)
   - Técnica de empuje lateral y recuperación
   - Curvas: cruce de piernas, radio de giro
   - Sprint: posición erguida, frecuencia de paso, amplitud
4. **`periodizacion_patinaje.md`** — Planificación de la temporada:
   - Macrociclos, mesociclos, microciclos
   - Fases: preparación general, específica, precompetitiva, competitiva, transición
   - Cargas: volumen vs intensidad por fase
5. **`estrategia_carreras.md`** — Tácticas por modalidad:
   - Drafting: cuando seguir, cuando atacar
   - Carreras de eliminación: gestión de posición
   - Relevos 5x1 lap: técnica de cambio, orden del equipo
   - Sprint 300m: salida, aceleración, llegada
   - Maratón: gestión de energía, grupos, sprint final
6. **`analisis_rendimiento.md`** — Métricas y análisis:
   - Tiempos de referencia por categoría y edad
   - Potencia y frecuencia de paso
   - Relación entre resultados en gym y rendimiento en pista
7. **`lesiones_prevencion.md`** — Lesiones comunes y prevención:
   - Rodilla del patinador (valgos)
   - Cadera: tendinitis del iliopsoas
   - Espalda baja: sobrecarga lumbar
   - Tobillo: esguinces y propriocepción

## System Prompt del Agente

```python
SKATING_EXPERT_SYSTEM_PROMPT = """
Eres un entrenador experto y estratega de patinaje de velocidad con más de 20 años
de experiencia a nivel nacional e internacional. Has entrenado atletas en todas las
categorías desde escuela hasta mayores, con resultados en Juegos Panamericanos,
Campeonatos Mundiales y Copas del Mundo.

Tu conocimiento incluye:
- Reglamento completo de World Skate y federaciones nacionales
- Periodización deportiva específica para el patinaje de velocidad
- Biomecánica y corrección técnica avanzada
- Estrategias de carrera para cada modalidad y categoría
- Integración de cross-training (ciclismo, gimnasio, natación)
- Psicología deportiva aplicada al patinaje
- Nutrición específica para patinadores

Cuando respondas:
1. Adapta tu respuesta a la categoría y nivel del atleta
2. Sé específico y técnico cuando el contexto lo requiera
3. Consulta siempre el calendario de entrenamientos para dar recomendaciones contextuales
4. Si hay datos del atleta disponibles, úsalos para personalizar la respuesta
5. En caso de lesión, siempre recomienda consultar con un médico/fisioterapeuta

Modalidades que conoces: 300m lanzado, 300m, 500m, 1000m, 1500m, 3000m, 5000m, 
10000m, maratón, relevos 5x1 lap, eliminación, puntos.
"""
```

## Herramientas (LangChain Tools) del Agente

```python
@tool
def get_athlete_training_history(athlete_id: str, weeks: int = 8) -> dict:
    """Obtiene el historial de entrenamiento de las últimas N semanas de un atleta"""

@tool
def get_athlete_competition_results(athlete_id: str, limit: int = 10) -> list:
    """Obtiene los últimos N resultados de competencia del atleta"""

@tool
def get_upcoming_competitions(days_ahead: int = 30) -> list:
    """Obtiene competencias en los próximos N días"""

@tool
def get_category_reference_times(category: str, modality: str) -> dict:
    """Obtiene tiempos de referencia para una categoría y modalidad"""

@tool
def create_training_session(session_data: dict) -> str:
    """Crea una nueva sesión de entrenamiento en el calendario"""

@tool
def analyze_performance_trend(athlete_id: str, modality: str) -> dict:
    """Analiza la tendencia de rendimiento del atleta en una modalidad"""
```

## Ejemplos de consultas al agente
```
"Analiza los últimos 3 meses de Juan (ID: xxx) y dime si está en buena forma para el campeonato"
"¿Qué estrategia de carrera recomiendes para María en los 3000m de eliminación?"
"Crea un microciclo de carga alta para la semana previa a la competencia regional"
"¿A qué velocidad debería salir Carlos en los 300m para lograr un tiempo de 29 segundos?"
"¿Cuál es la posición ideal de manos y brazos durante el sprint?"
"Compara el rendimiento del grupo juvenil con los tiempos de referencia nacionales"
```
