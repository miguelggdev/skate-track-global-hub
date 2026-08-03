import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PermissionLetterData {
  clubName: string;
  clubCity: string;
  coachName: string;
  directorTitle: string;
  directorName: string;
  institutionName: string;
  athleteName: string;
  athleteCategory: string;
  competitionName: string;
  competitionCity: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  additionalNotes: string;
  signatureDataUrl?: string;
}

export interface AthleteCardData {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  identificationNumber: string;
  year: number;
  clubName: string;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const ORANGE: [number, number, number] = [234, 88, 12];
const WHITE: [number, number, number] = [255, 255, 255];
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [120, 120, 120];
const LIGHT_ORANGE: [number, number, number] = [255, 237, 213];

// ─── Permission Letter ────────────────────────────────────────────────────────

export function generatePermissionLetterPDF(data: PermissionLetterData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;

  // Header bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(data.clubName.toUpperCase(), margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Club de Patinaje de Velocidad — ${data.clubCity}`, margin, 20);

  // Accent strip
  doc.setFillColor(...LIGHT_ORANGE);
  doc.rect(0, 28, pageW, 3, 'F');

  let y = 44;

  // Date right-aligned
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${data.clubCity}, ${formatDateLong(data.issueDate)}`, pageW - margin, y, { align: 'right' });

  y += 12;

  // Recipient block
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Señor(a):', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.directorTitle} ${data.directorName}`, margin, y);
  y += 6;
  doc.text(data.institutionName, margin, y);
  y += 6;
  doc.text('Ciudad', margin, y);
  y += 10;

  // Subject
  doc.setFont('helvetica', 'bold');
  doc.text('Asunto:', margin, y);
  doc.setFont('helvetica', 'normal');
  const subjectX = margin + doc.getTextWidth('Asunto: ');
  doc.text(`Permiso para participar en ${data.competitionName}`, subjectX, y);
  y += 12;

  // Salutation
  doc.text(`Respetado(a) ${data.directorTitle}:`, margin, y);
  y += 9;

  // Body paragraphs
  const endDateStr = data.endDate ? ` al ${formatDateLong(data.endDate)}` : '';
  const paragraphs = [
    `Por medio de la presente, el ${data.clubName} se permite solicitar respetuosamente ` +
      `su valioso apoyo para conceder permiso al/a la estudiante deportista ${data.athleteName}, ` +
      `quien hace parte de nuestra institución en la categoría ${data.athleteCategory}.`,
    `Dicho(a) deportista participará en la competencia "${data.competitionName}", ` +
      `a realizarse en la ciudad de ${data.competitionCity}, los días ${formatDateLong(data.startDate)}${endDateStr}.`,
    `Esta participación es de gran importancia para el desarrollo deportivo del/la estudiante ` +
      `y representa una oportunidad de representar dignamente a su institución educativa y al club.`,
    data.additionalNotes ||
      `El regreso del/la estudiante está previsto para el día siguiente a la finalización de la competencia, ` +
        `garantizando así la continuidad de su proceso académico.`,
    `Agradecemos de antemano su comprensión y colaboración en el fomento del deporte ` +
      `y el bienestar de nuestros atletas.`,
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);

  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5.5 + 5;
  }

  y += 4;
  doc.text('Cordialmente,', margin, y);
  y += 6;

  // Embedded signature image (if provided)
  if (data.signatureDataUrl) {
    try {
      doc.addImage(data.signatureDataUrl, 'PNG', margin, y, 55, 18);
      y += 20;
    } catch {
      y += 14;
    }
  } else {
    y += 14;
  }

  // Signature line
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 65, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(data.coachName, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text('Entrenador / Director Deportivo', margin, y);
  doc.text(data.clubName, margin, y + 5);

  // Footer
  doc.setFillColor(...ORANGE);
  doc.rect(0, 282, pageW, 1, 'F');
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text(
    `Generado el ${formatDateLong(new Date().toISOString().slice(0, 10))} — ${data.clubName}`,
    pageW / 2,
    288,
    { align: 'center' }
  );

  doc.save(`carta_permiso_${slugify(data.athleteName)}_${data.issueDate}.pdf`);
}

// ─── Athlete Card ─────────────────────────────────────────────────────────────

export async function generateAthleteCardPDF(data: AthleteCardData): Promise<void> {
  // Standard CR80 card: 85.6 × 54 mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
  const W = 85.6;
  const H = 54;

  // Background
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, W, H, 'F');

  // Orange top bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 10, 'F');

  // Left accent stripe
  doc.setFillColor(...ORANGE);
  doc.rect(0, 10, 2.5, H - 10, 'F');

  // Club name
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(data.clubName.toUpperCase(), W / 2, 6.5, { align: 'center' });

  // "CARNET DEPORTISTA" subtitle strip
  doc.setFillColor(...LIGHT_ORANGE);
  doc.rect(2.5, 10, W - 2.5, 5.5, 'F');
  doc.setTextColor(...ORANGE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('CARNET DEPORTISTA', 5.5, 13.8);

  // Athlete name
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const fullName = `${data.firstName} ${data.lastName}`;
  const nameLines = doc.splitTextToSize(fullName, 52);
  doc.text(nameLines, 5.5, 22);

  let infoY = nameLines.length > 1 ? 31 : 27;

  // Category badge
  doc.setFillColor(...ORANGE);
  doc.roundedRect(5.5, infoY, 32, 5, 1.2, 1.2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(data.category.toUpperCase(), 21.5, infoY + 3.4, { align: 'center' });

  infoY += 8;

  // ID number
  if (data.identificationNumber) {
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Identificación', 5.5, infoY);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(data.identificationNumber, 5.5, infoY + 4);
  }

  // Validity year
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(`VIGENCIA ${data.year}`, 5.5, H - 4);

  // QR code
  const qrDataUrl = await QRCode.toDataURL(data.id, {
    width: 280,
    margin: 1,
    color: { dark: '#1e1e1e', light: '#fafafa' },
  });
  const qrSize = 23;
  const qrX = W - qrSize - 4;
  const qrY = 16;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.text('Escanear para verificar', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });

  // Bottom separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(2.5, H - 8, W - 2, H - 8);

  doc.save(`carnet_${slugify(data.firstName)}_${slugify(data.lastName)}_${data.year}.pdf`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${d} de ${months[m - 1]} de ${y}`;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}
