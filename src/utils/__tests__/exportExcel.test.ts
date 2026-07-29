import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock XLSX — hoisted above imports by Vitest automatically
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn((_data) => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

import * as XLSX from 'xlsx';
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
  it('creates workbook and calls writeFile', () => {
    const data = [{ name: 'Test', value: 1 }];
    exportToExcel(data, 'test-file', 'Hoja1');

    expect(XLSX.utils.book_new).toHaveBeenCalledOnce();
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test-file.xlsx');
  });

  it('appends .xlsx extension to filename', () => {
    exportToExcel([], 'my-report');
    const lastCall = (XLSX.writeFile as ReturnType<typeof vi.fn>).mock.lastCall;
    expect(lastCall?.[1]).toMatch(/\.xlsx$/);
  });
});

describe('exportAthletesList', () => {
  it('maps athlete fields to Spanish column headers', () => {
    const athletes = [{
      first_name: 'Juan', last_name: 'Pérez',
      athlete_number: 'COL-001', category: 'Juvenil',
      status: 'active', date_of_birth: '2007-03-15', email: 'j@t.com',
    }];

    exportAthletesList(athletes);

    const rows = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.lastCall?.[0] as Record<string, unknown>[];
    expect(rows?.[0]).toMatchObject({
      'Nombre': 'Juan',
      'Apellido': 'Pérez',
      'Número': 'COL-001',
      'Categoría': 'Juvenil',
    });
  });

  it('handles missing optional fields gracefully', () => {
    expect(() => exportAthletesList([{}])).not.toThrow();
  });
});

describe('exportFinanceTransactions', () => {
  it('maps transaction fields to Spanish headers', () => {
    const txs = [{ description: 'Cuota', amount: 150000, transaction_type: 'income' }];
    exportFinanceTransactions(txs);
    const rows = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.lastCall?.[0] as Record<string, unknown>[];
    expect(rows?.[0]).toMatchObject({ 'Descripción': 'Cuota', 'Monto': 150000 });
  });
});

describe('exportCompetitionResults', () => {
  it('maps result fields to Spanish headers', () => {
    const results = [{ athlete_name: 'Juan', time_formatted: '38.241', position: 1 }];
    exportCompetitionResults(results);
    const rows = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.lastCall?.[0] as Record<string, unknown>[];
    expect(rows?.[0]).toMatchObject({ 'Atleta': 'Juan', 'Tiempo': '38.241', 'Posición': 1 });
  });
});
