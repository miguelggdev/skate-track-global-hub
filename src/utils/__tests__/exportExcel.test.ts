import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del helper de exceljs — hoisted above imports by Vitest automatically
vi.mock('../excel', () => ({
  createWorkbook: vi.fn(() => ({})),
  addJsonSheet: vi.fn(),
  downloadWorkbook: vi.fn(() => Promise.resolve()),
}));

import * as ExcelHelpers from '../excel';
import {
  exportToExcel,
  exportAthletesList,
  exportFinanceTransactions,
  exportCompetitionResults,
} from '../exportExcel';

// Clear all mocks before every test so call indices are always fresh
beforeEach(() => {
  vi.clearAllMocks();
});

describe('exportToExcel', () => {
  it('creates workbook, adds the sheet and downloads it', async () => {
    const data = [{ name: 'Test', value: 1 }];
    await exportToExcel(data, 'test-file', 'Hoja1');

    expect(ExcelHelpers.createWorkbook).toHaveBeenCalledOnce();
    expect(ExcelHelpers.addJsonSheet).toHaveBeenCalledWith(expect.anything(), 'Hoja1', data);
    expect(ExcelHelpers.downloadWorkbook).toHaveBeenCalledWith(expect.anything(), 'test-file.xlsx');
  });

  it('appends .xlsx extension to filename', async () => {
    await exportToExcel([], 'my-report');
    const lastCall = (ExcelHelpers.downloadWorkbook as ReturnType<typeof vi.fn>).mock.lastCall;
    expect(lastCall?.[1]).toMatch(/\.xlsx$/);
  });
});

describe('exportAthletesList', () => {
  it('maps athlete fields to Spanish column headers', async () => {
    const athletes = [{
      first_name: 'Juan', last_name: 'Pérez',
      athlete_number: 'COL-001', category: 'Juvenil',
      status: 'active', date_of_birth: '2007-03-15', email: 'j@t.com',
    }];

    await exportAthletesList(athletes);

    const rows = (ExcelHelpers.addJsonSheet as ReturnType<typeof vi.fn>).mock.lastCall?.[2] as Record<string, unknown>[];
    expect(rows?.[0]).toMatchObject({
      'Nombre': 'Juan',
      'Apellido': 'Pérez',
      'Número': 'COL-001',
      'Categoría': 'Juvenil',
    });
  });

  it('handles missing optional fields gracefully', async () => {
    await expect(exportAthletesList([{}])).resolves.not.toThrow();
  });
});

describe('exportFinanceTransactions', () => {
  it('maps transaction fields to Spanish headers', async () => {
    const txs = [{ description: 'Cuota', amount: 150000, transaction_type: 'income' }];
    await exportFinanceTransactions(txs);
    const rows = (ExcelHelpers.addJsonSheet as ReturnType<typeof vi.fn>).mock.lastCall?.[2] as Record<string, unknown>[];
    expect(rows?.[0]).toMatchObject({ 'Descripción': 'Cuota', 'Monto': 150000 });
  });
});

describe('exportCompetitionResults', () => {
  it('maps result fields to Spanish headers', async () => {
    const results = [{ athlete_name: 'Juan', time_formatted: '38.241', position: 1 }];
    await exportCompetitionResults(results);
    const rows = (ExcelHelpers.addJsonSheet as ReturnType<typeof vi.fn>).mock.lastCall?.[2] as Record<string, unknown>[];
    expect(rows?.[0]).toMatchObject({ 'Atleta': 'Juan', 'Tiempo': '38.241', 'Posición': 1 });
  });
});
