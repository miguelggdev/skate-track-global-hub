# SPEC-016 — Evaluaciones de Deportistas
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 02
**Prioridad:** ALTA

## Propósito
Registrar evaluaciones periódicas de rendimiento por atleta con 5 dimensiones (velocidad, técnica, fuerza, resistencia, general), visualización radar chart y seguimiento de evolución en el tiempo.

## Acceptance Criteria
- [x] Formulario de evaluación: atleta, tipo, fecha, 5 scores (0–10), medidas físicas, fortalezas, áreas de mejora, metas, notas coach, próxima evaluación
- [x] Radar chart (Recharts) con evaluación actual vs anterior para comparación visual
- [x] KPIs: score general, tendencia vs evaluación anterior, días para próxima evaluación
- [x] Historial completo por atleta con tabla paginada y estado (pending/completed/reviewed)
- [x] Página `/evaluaciones` con selector de atleta y tabs Radar | Historial
- [x] Ruta protegida para admin, coach, leader

## Archivos Creados
- `src/hooks/useEvaluations.ts`
- `src/components/evaluations/EvaluationForm.tsx`
- `src/components/evaluations/EvaluationRadarChart.tsx`
- `src/components/evaluations/EvaluationHistoryTable.tsx`
- `src/pages/EvaluationsPage.tsx`
