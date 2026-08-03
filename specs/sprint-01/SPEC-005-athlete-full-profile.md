# SPEC-005 — Perfil Completo del Deportista
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 01
**Prioridad:** ALTA

## Propósito
El modelo ER requiere ~30 campos más por atleta (médicos, familia, colegio, deportivos). El formulario de registro y el perfil deben capturar y mostrar toda esta información.

## Acceptance Criteria
- [ ] Formulario de registro de atleta con tabs: Datos Personales / Médico / Familia / Deportivo
- [ ] Campos médicos: grupo sanguíneo, EPS, seguro accidentes, peso, talla, IMC auto-calculado, alergias, fracturas, cirugías, limitaciones físicas, talla licra
- [ ] Campos familia: nombre padre, madre, teléfonos, correo acudiente
- [ ] Campos colegio: nombre colegio, grado, nivel estudio
- [ ] Campos deportivos: especialidad (fondista/velocista), entrenador asignado, teléfono personal
- [ ] Campos ubicación: ciudad nacimiento, barrio, país, nacionalidad
- [ ] Vista perfil del atleta muestra TODOS los campos organizados en tabs
- [ ] Validación Zod completa en todos los campos

## Archivos a Crear/Modificar
- `src/components/athletes/AthleteForm.tsx` — formulario multi-tab
- `src/components/athletes/AthleteProfile.tsx` — vista completa
- `src/hooks/useAthletes.ts` — queries con nuevos campos
- `src/types/athlete.ts` — tipos actualizados
