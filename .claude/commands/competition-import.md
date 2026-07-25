# /competition-import — Agente de Carga de Resultados de Competencias

Implementa el flujo completo del agente que carga resultados de competencias y los asigna a cada atleta.

## Componentes a crear

### 1. UI — Página de Carga de Resultados
En `src/pages/CompetitionImport.tsx` o como dialog en `src/components/competitions/`:
- Selector de competencia (existente o nueva)
- Upload de CSV/Excel con resultados
- Vista previa de los datos parseados
- Panel de matching: nombres detectados vs atletas en BD
- Resolución de ambigüedades (dropdown para elegir atleta correcto)
- Botón "Procesar y Guardar" con confirmación
- Resumen post-carga

**Formato CSV esperado:**
```
Posición,Nombre,Categoría,Tiempo,Modalidad,Medalla
1,Juan Pérez,Juvenil,2:30.45,300m,Oro
2,María García,Juvenil,2:31.12,300m,Plata
```

### 2. Supabase Edge Function — competition-results-agent
En `supabase/functions/competition-results-agent/index.ts`:

**Flujo del agente:**
1. Recibe array de resultados parseados del CSV
2. Para cada resultado:
   - Busca atleta por nombre exacto en `athletes`
   - Si no encuentra: fuzzy match (levenshtein_distance)
   - Si múltiples candidatos: retorna opciones para que el usuario elija
3. Valida: categoría correcta, tiempo válido, modalidad existente
4. Inserta en `competition_results` y `awards` (si hay medalla)
5. Actualiza estadísticas del atleta:
   - `best_times` por modalidad
   - `total_medals` (oro/plata/bronce)
   - `competition_count`
6. Genera notificación para cada atleta con su resultado
7. Notifica al coach de cada atleta

### 3. Hook React
`src/hooks/useCompetitionImport.ts`:
- `parseCSV(file)` → parsea archivo
- `matchAthletes(results)` → llama Edge Function para matching
- `confirmAndSave(resolvedResults)` → guarda confirmado
- `getImportStatus()` → estado del proceso

### 4. Migración SQL — best_times y competition_stats
```sql
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS competition_stats JSONB DEFAULT '{}';
-- { "total": 10, "gold": 3, "silver": 2, "bronze": 1, "best_times": {"300m": "2:30.45"} }
```

### 5. Trigger de Notificación Post-Import
Hook Supabase que cuando se inserta un resultado:
- Notifica al atleta via `notifications`
- Notifica al coach
- Actualiza el dashboard en tiempo real

## Roles con acceso
- INSERT: admin, delegate
- Ver resultados: todos los roles
- Aprobar importación: admin, delegate

## Salida esperada
Flujo completo funcional: subir CSV → previsualizar → confirmar → guardado en BD → notificaciones enviadas.
