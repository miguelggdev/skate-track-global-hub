# /training-plan-gen [athlete-id] — Generador de Plan de Entrenamiento con IA

Genera un plan de entrenamiento personalizado usando el Agente Entrenador de Patinaje (AG-02) para un atleta específico.

## Qué implementar

### 1. UI — Generador de Planes
En `src/components/training/TrainingPlanGenerator.tsx`:
- Selector de atleta
- Período del plan (semana / mes / temporada)
- Objetivo del plan (preparación competencia, base aeróbica, técnica, recuperación)
- Próxima competencia importante (con fecha)
- Nivel de carga deseado (suave / normal / fuerte)
- Botón "Generar Plan con IA"
- Vista del plan generado con opción de editar y guardar

### 2. Supabase Edge Function — training-plan-generator
En `supabase/functions/training-plan-generator/index.ts`:

**Datos que el agente consulta:**
- Perfil del atleta: categoría, nivel, historial de lesiones
- Últimas 8 semanas de entrenamiento (carga, tipo, asistencia)
- Resultados recientes de competencias
- Calendario de competencias próximas (próximas 12 semanas)
- Días disponibles para entrenar por semana

**Prompt del sistema del agente:**
```
Eres un entrenador experto en patinaje de velocidad con 20 años de experiencia.
Conoces el reglamento World Skate, la periodización deportiva, la biomecánica
del patinaje y las características de cada categoría (escuela, menores, transición,
prejuvenil, juvenil, mayores, masters).

Genera planes de entrenamiento considerando:
- Principios de periodización (volumen, intensidad, especificidad)
- Modalidades del patinaje: 300m, 500m, 1000m, 3000m, 5000m, 10000m, relevos
- Tipos de entrenamiento: técnica, velocidad, resistencia, fuerza, recuperación
- Integración con cross-training: ciclismo, gimnasio, natación
- Edad y categoría del atleta
- Próxima competencia importante
```

**Formato del plan generado:**
```json
{
  "semana": 1,
  "objetivo": "Base aeróbica",
  "carga_total": "alto",
  "sesiones": [
    {
      "dia": "Lunes",
      "tipo": "Técnica",
      "duracion_min": 90,
      "descripcion": "Trabajo de posición y empuje...",
      "ejercicios": ["...", "..."],
      "intensidad": "media"
    }
  ],
  "notas_entrenador": "Esta semana enfocamos..."
}
```

### 3. Integración con Calendar
Al guardar el plan: crear automáticamente las `training_sessions` en el calendario del club con los datos del plan generado.

### 4. Vista del Plan en Dashboard Coach
En `CoachDashboard.tsx`: nueva tab "Planes de Entrenamiento" con:
- Lista de planes activos por atleta
- Botón "Nuevo Plan con IA"
- Comparativa de carga planificada vs ejecutada

## Agente AG-02 Knowledge Base
Documentos que debe tener cargados:
- `periodizacion_patinaje_velocidad.pdf`
- `reglamento_world_skate_2024.pdf`
- `categorias_distancias_colombia.pdf`
- `biomecánica_patinaje_velocidad.pdf`
- `planes_entrenamiento_referencia.pdf`
