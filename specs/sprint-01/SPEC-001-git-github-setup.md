# SPEC-001 — Git + GitHub Setup Limpio
**Status:** `done`  
**Agente:** AG-CLAUDE-DB  
**Sprint:** 01  
**Prioridad:** CRÍTICA  

---

## Propósito
Establecer la base de control de versiones con historial limpio, rama `dev` de trabajo, y remote en GitHub.

## Acceptance Criteria
- [x] Repo en GitHub creado o conectado (remote `origin`)
- [x] Rama `dev` creada para trabajo diario
- [x] `.gitignore` correcto (excluye `node_modules`, `.env*`, `dist`)
- [x] CLAUDE.md, specs/ y WORK_PLAN.md commiteados en `master`
- [x] Schema inicial commiteado

## Archivos a Crear/Modificar
- `.gitignore` (verificar)
- `CLAUDE.md` ✅ (ya creado)
- `specs/` ✅ (ya creado)
- `WORK_PLAN.md`
- `supabase/migrations/20260101000000_initial_schema.sql` ✅ (ya existe)
