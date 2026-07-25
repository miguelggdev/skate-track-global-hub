# /nutrition-plan-gen [athlete-id] — Agente Nutricionista IA

Implementa el Agente Nutricionista (AG-04) completo: backend LangGraph + UI para planes nutricionales personalizados.

## Contexto del Agente

El Agente Nutricionista es experto en nutrición deportiva para patinadores de velocidad. Personaliza planes según:
- Datos del atleta: peso, talla, edad, nivel de actividad
- Calendario de entrenamientos (lee `training_sessions`)
- Próximas competencias (lee `competitions`)
- Objetivos: rendimiento, composición corporal, recuperación

## Qué implementar

### 1. Backend — `backend/agents/nutrition_agent.py`

**Knowledge Base del agente (documentos a cargar con `/embeddings-sync nutrition`):**
- Requerimientos calóricos para deportes de resistencia/velocidad
- Macronutrientes para ciclistas y patinadores (proteína 1.6-2g/kg, carbos 5-8g/kg)
- Nutrición pericompetitiva: carga de carbohidratos, pre-carrera, recuperación
- Suplementación legal: creatina, cafeína, beta-alanina, proteína whey
- Lista de sustancias prohibidas WADA (para evitar dopaje involuntario)
- Recetas prácticas para atletas jóvenes y familias
- Planes nutricionales por categoría de edad (6-12, 13-17, 18+)
- Hidratación: cálculo de pérdida de sudor, protocolo de rehidratación

**State del agente:**
```python
class NutritionAgentState(TypedDict):
    messages: list
    athlete_id: str
    body_metrics: dict         # height, weight, body_fat%, age
    training_this_week: list   # sesiones de la semana actual
    next_competition: dict     # próxima competencia (fecha, importancia)
    dietary_restrictions: list # alergias, vegetariano, etc.
    nutrition_goal: str        # performance / weight_loss / muscle_gain / recovery
    current_plan: dict         # plan nutricional generado
```

### 2. UI — `src/components/agents/NutritionPlanView.tsx`
- Form de datos del atleta (prellenado desde la BD)
- Selector de objetivo nutricional
- Campo de restricciones dietarias
- Botón "Generar Plan con IA"
- Vista del plan generado:
  - Plan semanal de comidas (desayuno, media mañana, almuerzo, merienda, cena, post-entrenamiento)
  - Macros estimados por día (calorías, proteína, carbos, grasas)
  - Recomendaciones de hidratación
  - Suplementos sugeridos
  - Nutrición pre/durante/post competencia
- Botón guardar en perfil del atleta
- Opción de generar PDF del plan

### 3. Integración con Dashboard Atleta
En `AthleteDashboard.tsx`: nueva tab "Nutrición":
- Chat con la nutricionista IA
- Plan nutricional activo
- Calculadora de hidratación (ingresa duración y temperatura del entrenamiento)
- Botón "¿Qué comer antes de mi competencia?" (con fecha automática de la próxima)

### 4. Migración SQL
```sql
CREATE TABLE IF NOT EXISTS athlete_nutrition_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  goal TEXT NOT NULL,
  valid_from DATE,
  valid_until DATE,
  created_by_agent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Ejemplos de uso del agente
```
"¿Qué debo comer el día antes de la competencia de 1000m?"
"Dame un plan para bajar 2kg antes del campeonato en 4 semanas"
"¿Puedo tomar creatina? ¿Qué dosis?"
"Tengo intolerancia a la lactosa, ¿cómo reemplazo el whey?"
"¿Cuánto debo hidratarme hoy que tengo 2 horas de entrenamiento fuerte?"
```
