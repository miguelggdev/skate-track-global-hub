# /bulk-import [entidad] — Importación Masiva desde Excel/CSV

Implementa el flujo completo de importación masiva para cualquier entidad del sistema.

## Uso
```
/bulk-import athletes     # Importar atletas desde Excel
/bulk-import payments     # Importar pagos históricos
/bulk-import results      # Importar resultados de competencia (ver también /competition-import)
```

## Qué implementar

### 1. Componente Base — `src/components/shared/BulkImportWizard.tsx`
Wizard de 4 pasos:
1. **Subir archivo** (CSV o Excel) — drag & drop
2. **Mapear columnas** — usuario mapea sus columnas al formato del sistema
3. **Previsualizar y validar** — tabla con errores señalados en rojo
4. **Confirmar importación** — resumen de cuántos se importan, cuántos tienen error

### 2. Utility — `src/utils/importParser.ts`
- `parseExcel(file)` → array de objetos usando `xlsx`
- `parseCSV(file)` → array de objetos
- `validateRow(row, schema)` → valida cada fila con Zod
- `detectDuplicates(rows, existingData)` → detecta duplicados

### 3. Template de descarga
Para cada entidad: un archivo Excel de ejemplo descargable con las columnas correctas y datos de ejemplo.

### 4. Entidad: Athletes
**Columnas mínimas requeridas:** nombre, apellido, fecha_nacimiento, categoria, genero
**Columnas opcionales:** email, telefono, peso, talla, nombre_padre, email_padre

### 5. Edge Function — bulk-import-processor
Procesa en lotes de 50 registros para no saturar la BD.
Reporta progreso en tiempo real via Supabase Realtime.

## Manejo de errores
- Fila con error → no se importa, pero el resto sí
- Reporte post-importación: X exitosos, Y con error (con detalle del error por fila)
- Opción de descargar Excel de filas con error para corregir y reimportar
