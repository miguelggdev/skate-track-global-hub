# SPEC-008 — Gestión de Equipamiento
**Status:** `draft`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 01
**Prioridad:** MEDIA

## Propósito
Registrar el inventario de patines, bicicletas y otros equipos del club, sus asignaciones a deportistas y el historial de mantenimiento.

## Acceptance Criteria
- [ ] Inventario de equipamiento con listado paginado y filtros por tipo/estado
- [ ] Formulario de registro de equipo: tipo, marca, modelo, talla (patines), diámetro ruedas
- [ ] Asignar equipo a un atleta (con fecha de asignación)
- [ ] Registrar mantenimiento: fecha, tipo, descripción, piezas reemplazadas, costo, próximo mantenimiento
- [ ] Alertas visuales cuando un equipo está próximo a mantenimiento (≤ 7 días)
- [ ] Vista de historial completo de cada equipo
- [ ] Dashboard de inventario: disponible / asignado / en mantenimiento / retirado

## Archivos a Crear
- `src/pages/EquipmentPage.tsx`
- `src/components/equipment/EquipmentCard.tsx`
- `src/components/equipment/MaintenanceForm.tsx`
- `src/components/equipment/EquipmentAssignmentDialog.tsx`
- `src/hooks/useEquipment.ts`
