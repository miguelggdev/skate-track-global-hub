import * as XLSX from 'xlsx';

function autoFitColumns(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (!data.length) return;
  const cols = Object.keys(data[0]);
  ws['!cols'] = cols.map(col => ({
    wch: Math.max(
      col.length,
      ...data.map(row => String(row[col] ?? '').length)
    ) + 2,
  }));
}

function addStyledHeader(wb: XLSX.WorkBook, ws: XLSX.WorkSheet, title: string) {
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  ws['A1'] = { v: title, t: 's' };
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = 'Datos'
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  autoFitColumns(ws, data as Record<string, unknown>[]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportMultiSheet(
  sheets: Array<{ name: string; data: Record<string, unknown>[] }>,
  filename: string
) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    autoFitColumns(ws, data);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Domain-specific exporters ─────────────────────────────────────────────

export function exportAthletesList(athletes: Array<{
  first_name?: string; last_name?: string; athlete_number?: string;
  category?: string; status?: string; date_of_birth?: string; email?: string;
}>) {
  const rows = athletes.map(a => ({
    'Número': a.athlete_number ?? '',
    'Nombre': a.first_name ?? '',
    'Apellido': a.last_name ?? '',
    'Categoría': a.category ?? '',
    'Estado': a.status ?? '',
    'Fecha Nac.': a.date_of_birth ?? '',
    'Email': a.email ?? '',
  }));
  exportToExcel(rows, `atletas_${new Date().toISOString().slice(0,10)}`, 'Atletas');
}

export function exportFinanceTransactions(transactions: Array<{
  transaction_date?: string; description?: string; amount?: number;
  transaction_type?: string; payment_status?: string; payer_name?: string;
}>) {
  const rows = transactions.map(t => ({
    'Fecha': t.transaction_date ?? '',
    'Descripción': t.description ?? '',
    'Monto': t.amount ?? 0,
    'Tipo': t.transaction_type ?? '',
    'Estado': t.payment_status ?? '',
    'Pagador': t.payer_name ?? '',
  }));
  exportToExcel(rows, `finanzas_${new Date().toISOString().slice(0,10)}`, 'Transacciones');
}

export function exportCompetitionResults(results: Array<{
  athlete_name?: string; competition_name?: string; distance?: string;
  position?: number; time_formatted?: string; medal?: string; category?: string;
}>) {
  const rows = results.map(r => ({
    'Atleta': r.athlete_name ?? '',
    'Competencia': r.competition_name ?? '',
    'Distancia': r.distance ?? '',
    'Posición': r.position ?? '',
    'Tiempo': r.time_formatted ?? '',
    'Medalla': r.medal ?? '',
    'Categoría': r.category ?? '',
  }));
  exportToExcel(rows, `resultados_${new Date().toISOString().slice(0,10)}`, 'Resultados');
}

// ─── Planilla de inscripción Liga de Bogotá ───────────────────────────────────

export interface PlanillaAthleteRow {
  cont: number;
  num_comp?: string;
  nombres: string;
  apellidos: string;
  rama: 'Damas' | 'Varones';
  dia: number;
  mes: number;
  año: number;
  categoria: string;
  tipo_registro: 'Ligado' | 'No Ligado' | 'Nuevo';
  tipo_doc: string;
  num_doc: string;
  p1?: boolean;
  p2?: boolean;
  p3?: boolean;
  p4?: boolean;
  p5?: boolean;
}

export interface PlanillaHeaderInfo {
  evento: string;
  fecha: string;
  club: string;
  liga: string;
  presidente: string;
  num_id_presid: string;
  delegado: string;
  tel_delegado: string;
  entrenador: string;
  tel_entrenador: string;
  valor_ins_club?: number;
  valor_ins_dep?: number;
}

export function exportRegistrationPlanilla(
  athletes: PlanillaAthleteRow[],
  header: PlanillaHeaderInfo
) {
  const wb = XLSX.utils.book_new();

  // Fila 1: encabezado del evento (aplanado en una sola hoja para compatibilidad)
  const headerRows: Record<string, unknown>[] = [
    { Campo: 'Evento', Valor: header.evento },
    { Campo: 'Fecha', Valor: header.fecha },
    { Campo: 'Club', Valor: header.club },
    { Campo: 'Liga', Valor: header.liga },
    { Campo: 'Presidente', Valor: header.presidente },
    { Campo: 'Número Id. Presid.', Valor: header.num_id_presid },
    { Campo: 'Delegado', Valor: header.delegado },
    { Campo: 'Teléfono Del.', Valor: header.tel_delegado },
    { Campo: 'Entrenador', Valor: header.entrenador },
    { Campo: 'Teléfono Ent.', Valor: header.tel_entrenador },
    { Campo: 'Valor Insc. Ord. Club', Valor: header.valor_ins_club ?? 161000 },
    { Campo: 'Valor Ins. Ord. Dep.', Valor: header.valor_ins_dep ?? 79200 },
    { Campo: 'Cant. Dep. Inscritos', Valor: athletes.length },
    {
      Campo: 'Valor a Pagar',
      Valor: (header.valor_ins_club ?? 161000) + athletes.length * (header.valor_ins_dep ?? 79200),
    },
  ];

  const wsHeader = XLSX.utils.json_to_sheet(headerRows);
  wsHeader['!cols'] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsHeader, 'Encabezado');

  // Hoja de deportistas
  const athleteRows = athletes.map(a => ({
    'Cont': a.cont,
    '# Comp': a.num_comp ?? '',
    'Nombres': a.nombres,
    'Apellidos': a.apellidos,
    'Rama': a.rama,
    'Día': a.dia,
    'Mes': a.mes,
    'Año': a.año,
    'Categoría': a.categoria,
    'Tipo Registro': a.tipo_registro,
    'Tipo Doc': a.tipo_doc,
    'Num Doc': a.num_doc,
    'P1': a.p1 ? 'X' : '',
    'P2': a.p2 ? 'X' : '',
    'P3': a.p3 ? 'X' : '',
    'P4': a.p4 ? 'X' : '',
    'P5': a.p5 ? 'X' : '',
  }));

  const wsAthletes = XLSX.utils.json_to_sheet(athleteRows);
  autoFitColumns(wsAthletes, athleteRows);
  XLSX.utils.book_append_sheet(wb, wsAthletes, 'Deportistas');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `planilla_inscripcion_${header.evento.replace(/\s+/g, '_')}_${date}.xlsx`);
}

export function exportAttendanceReport(sessions: Array<{
  date?: string; session_name?: string; athlete_name?: string; attended?: boolean; notes?: string;
}>) {
  const rows = sessions.map(s => ({
    'Fecha': s.date ?? '',
    'Sesión': s.session_name ?? '',
    'Atleta': s.athlete_name ?? '',
    'Asistió': s.attended ? 'Sí' : 'No',
    'Notas': s.notes ?? '',
  }));
  exportToExcel(rows, `asistencia_${new Date().toISOString().slice(0,10)}`, 'Asistencia');
}
