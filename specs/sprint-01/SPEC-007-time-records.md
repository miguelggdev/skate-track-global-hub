# SPEC-007 — Registro de Tiempos y Pruebas
**Status:** `draft`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 01
**Prioridad:** ALTA

## Propósito
Registrar los tiempos cronometrados por atleta, por prueba (evento) y por competencia/entrenamiento. Calcular automáticamente récords personales y del club.

## Acceptance Criteria
- [ ] Vista de registro de tiempo: seleccionar atleta + prueba + contexto (entrenamiento o competencia)
- [ ] Input de tiempo en formato mm:ss.ms con validación
- [ ] Al guardar: el sistema detecta automáticamente si es récord personal
- [ ] Perfil del atleta muestra historial de tiempos con gráfica de progreso (Recharts)
- [ ] Vista comparativa: tiempos del atleta vs promedio de su categoría
- [ ] Tabla de mejores tiempos por prueba en el club (ranking interno)
- [ ] Vista de evolución: tiempo inicial vs tiempo actual (% de mejora)
- [ ] Filtros: por prueba, por fecha, por categoría

## Archivos a Crear
- `src/components/times/TimeRecordForm.tsx`
- `src/components/times/TimeHistoryChart.tsx` — gráfica Recharts de evolución
- `src/components/times/ClubRanking.tsx` — ranking interno por prueba
- `src/hooks/useTimeRecords.ts`
- `src/lib/time-formatter.ts` — ms → "1:23.456"
