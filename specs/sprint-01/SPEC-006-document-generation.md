# SPEC-006 — Generación de Documentos (Cartas, Carnets, Excel)
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 01
**Prioridad:** CRÍTICA

## Propósito
El club necesita generar automáticamente: cartas de permiso para colegios, carnets de deportistas y planillas Excel de competencias. Son los documentos más usados en el día a día.

## Acceptance Criteria

### Carta de Permiso para Colegios
- [ ] Genera PDF con: membrete del club, fecha, nombre del rector/director del colegio, nombre del estudiante-deportista, nombre de la competencia, ciudad, fechas, firma del entrenador/director
- [ ] Seleccionas: atleta + competencia → genera la carta automáticamente
- [ ] Puede editarse antes de imprimir (campos editables)
- [ ] Se guarda en `documents` con tipo `carta_permiso_colegio`
- [ ] Se puede descargar como PDF

### Carnet del Deportista
- [ ] Genera carnet con: foto del atleta, nombre completo, categoría, número de identificación, código QR único, logo del club, año vigente
- [ ] Tamaño estándar de carnet (85.6mm × 54mm)
- [ ] Se genera automáticamente al registrar un atleta nuevo
- [ ] Se puede regenerar desde el perfil del atleta
- [ ] Se guarda en `documents` con tipo `carnet_deportista`

### Planilla Excel de Competencia
- [ ] Exporta todos los atletas inscritos en una competencia a Excel
- [ ] Columnas: Nombre, Apellido, Identificación, Categoría, Prueba inscrita, Club, Entrenador, Teléfono emergencia
- [ ] Formato compatible con planillas de federación colombiana
- [ ] Botón "Exportar Excel" en la vista de detalle de competencia

## Archivos a Crear
- `src/components/documents/PermissionLetterGenerator.tsx`
- `src/components/documents/AthleteCardGenerator.tsx`
- `src/components/documents/CompetitionExcelExport.tsx`
- `src/hooks/useDocumentGeneration.ts`
- `src/lib/pdf-generator.ts` — wrapper de jsPDF para plantillas del club
- `src/lib/excel-generator.ts` — wrapper de XLSX para exportaciones

## Notas
- Ya tenemos jsPDF y XLSX instalados en el proyecto
- Los templates HTML viven en `document_templates` en Supabase
- El QR del carnet usa el `id` del atleta como código único
