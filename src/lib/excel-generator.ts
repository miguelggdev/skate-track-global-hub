import { exportToExcel } from '@/utils/exportExcel';

export interface CompetitionRegistrationRow {
  first_name: string;
  last_name: string;
  identification_number: string | null;
  identification_type: string | null;
  category: string;
  gender: string | null;
  event_name: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  coach_name?: string | null;
  club?: string;
}

export function exportCompetitionRegistrations(
  competitionName: string,
  registrations: CompetitionRegistrationRow[],
  clubName = 'Club de Patinaje'
): void {
  const rows = registrations.map((r, i) => ({
    'N°': i + 1,
    'Nombre': r.first_name,
    'Apellido': r.last_name,
    'Tipo Doc.': r.identification_type ?? 'CC',
    'Identificación': r.identification_number ?? '',
    'Categoría': r.category,
    'Rama': r.gender === 'femenino' ? 'Damas' : r.gender === 'masculino' ? 'Varones' : '',
    'Prueba Inscrita': r.event_name ?? '',
    'Club': r.club ?? clubName,
    'Entrenador': r.coach_name ?? '',
    'Contacto Emergencia': r.emergency_contact_name ?? '',
    'Tel. Emergencia': r.emergency_contact_phone ?? '',
  }));

  const date = new Date().toISOString().slice(0, 10);
  const filename = `planilla_${competitionName.replace(/\s+/g, '_')}_${date}`;
  exportToExcel(rows, filename, 'Inscritos');
}
