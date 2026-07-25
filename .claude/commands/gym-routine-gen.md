# /gym-routine-gen [athlete-id] — Agente de Fuerza y Gimnasio

Implementa el Agente de Gym/Fuerza (AG-05) para generar rutinas de acondicionamiento físico complementarias al patinaje.

## Contexto del Agente

Especialista en fuerza y acondicionamiento para patinadores de velocidad. Se enfoca en los músculos clave del patinaje:
- **Piernas:** cuádriceps, isquiotibiales, glúteos, pantorrillas (empuje principal)
- **Core:** abdomen, lumbar, oblicuos (estabilidad en posición)
- **Caderas:** abductores, aductores (recuperación del paso)
- **Postura:** espalda alta, hombros (mantener posición aerodinámica)

## Qué implementar

### 1. Backend — `backend/agents/gym_agent.py`

**Knowledge Base:**
- Ejercicios específicos para patinadores (sentadilla profunda, zancada lateral, puente de glúteos, hip thrust, etc.)
- Periodización de fuerza: fase acumulación → transformación → realización → descarga
- Prevención de lesiones comunes: rodillas (valgos), cadera, espalda baja
- Rutinas por nivel: principiante (sin pesas), intermedio (máquinas), avanzado (pesas libres)
- Pliometría para potencia de empuje (saltos, box jumps, skater jumps)
- Ejercicios de movilidad y flexibilidad para patinadores
- Integración con carga de entrenamiento en pista

**Principio clave:** La fuerza en el gimnasio NO debe competir con el entrenamiento en pista. Ajustar según el calendario.

### 2. UI — `src/components/agents/GymRoutineView.tsx`
- Datos del atleta (nivel, días disponibles para gym, equipamiento)
- Calendario de entrenamientos en pista (auto-cargado)
- Objetivo: fuerza base / potencia / mantenimiento / prevención lesiones
- Plan generado:
  - División semanal (ej: Lunes-Piernas, Miércoles-Core, Viernes-Pliometría)
  - Por sesión: ejercicio, series, reps, descanso, notas de ejecución
  - GIFs/imágenes de referencia de los ejercicios (links a YouTube)
  - Progresión semana a semana

### 3. Biblioteca de Ejercicios
```sql
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_groups TEXT[],
  category TEXT,  -- 'fuerza', 'pliometría', 'movilidad', 'core'
  difficulty TEXT, -- 'principiante', 'intermedio', 'avanzado'
  equipment TEXT[], -- 'ninguno', 'barra', 'mancuernas', 'máquina', 'banda'
  video_url TEXT,
  description TEXT,
  skater_specific BOOLEAN DEFAULT FALSE
);
```

### 4. Integración con Calendario
Al generar rutina: crear sesiones de tipo "Gimnasio" en `training_sessions` los días designados, coordinadas con las sesiones de pista.

## Ejemplos de interacción con el agente
```
"Dame una rutina de gym para este semana que tengo entrenamientos en pista lunes, miércoles y viernes"
"¿Qué ejercicios hago para mejorar mi empuje lateral?"
"Tengo dolor en la rodilla, ¿qué ejercicios debo evitar?"
"Quiero mejorar mi sprint en los últimos 100m, ¿qué entreno en el gym?"
"Dame una rutina de movilidad para hacer antes de patinar"
```
