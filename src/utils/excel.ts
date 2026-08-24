import ExcelJS from 'exceljs';

// Reemplaza a `xlsx` (prototype pollution / ReDoS sin fix upstream, GHSA-4r6h-8v6p-xvw6 y
// GHSA-5pgg-2g8v-p4x9) por `exceljs`. Helpers mínimos que replican los patrones que ya
// usaba el proyecto (book_new + json_to_sheet/aoa_to_sheet + writeFile).

export function createWorkbook(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}

/** Crea una hoja a partir de un array de objetos — encabezados = llaves del primer objeto. */
export function addJsonSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  rows: Record<string, unknown>[],
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  if (rows.length === 0) return sheet;

  const headers = Object.keys(rows[0]);
  sheet.columns = headers.map((key) => ({
    header: key,
    key,
    width: Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
  }));
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  return sheet;
}

/** Crea una hoja a partir de filas "array de arrays" (la primera fila ya incluye encabezados). */
export function addAoaSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  rows: unknown[][],
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  rows.forEach((row) => sheet.addRow(row));
  return sheet;
}

/** Descarga el workbook como .xlsx en el navegador. */
export async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Lee un archivo .xlsx/.xls subido por el usuario y devuelve su primera hoja. */
export async function readWorkbookFile(file: File): Promise<ExcelJS.Worksheet> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('El archivo no contiene hojas');
  return sheet;
}

/**
 * Convierte una hoja a un array de objetos usando la primera fila como encabezados,
 * igual que `XLSX.utils.sheet_to_json(ws, { defval: '' })`.
 */
export function worksheetToJson(sheet: ExcelJS.Worksheet): Record<string, unknown>[] {
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '').trim();
  });

  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (row.cellCount === 0) continue;
    const obj: Record<string, unknown> = {};
    let hasValue = false;
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const cell = row.getCell(colNumber);
      let value: unknown = cell.value ?? '';
      // Fórmulas: exceljs devuelve { formula, result } — nos quedamos con el resultado
      if (value && typeof value === 'object' && 'result' in (value as Record<string, unknown>)) {
        value = (value as { result: unknown }).result ?? '';
      }
      if (value !== '' && value !== null && value !== undefined) hasValue = true;
      obj[header] = value;
    });
    if (hasValue) rows.push(obj);
  }
  return rows;
}
