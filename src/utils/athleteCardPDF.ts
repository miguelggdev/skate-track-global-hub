import jsPDF from 'jspdf';
import { AthleteDetails } from '@/hooks/useAthleteDetails';
import { ClubSettings } from '@/hooks/useClubSettings';

const CARD_WIDTH = 85.6; // mm (ID-1 standard)
const CARD_HEIGHT = 53.98; // mm

export const generateAthleteCardPDF = async (
  athlete: AthleteDetails,
  clubSettings: ClubSettings,
  qrCodeUrl: string
) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_WIDTH, CARD_HEIGHT],
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      escuela: 'Escuela',
      menores: 'Menores',
      transicion: 'Transición',
      prejuvenil: 'Pre-juvenil',
      juvenil: 'Juvenil',
      mayores: 'Mayores'
    };
    return labels[category] || category;
  };

  const getValidityYear = () => {
    if (athlete.join_date) {
      return new Date(athlete.join_date).getFullYear();
    }
    return new Date().getFullYear();
  };

  const getIdDisplay = () => {
    if (!athlete.id_number) return 'Sin registrar';
    const idType = athlete.id_type?.toUpperCase() || 'ID';
    return `${idType} ${athlete.id_number}`;
  };

  const getBloodTypeDisplay = () => {
    return athlete.body_info?.blood_type || 'N/A';
  };

  // ==================== FRONT SIDE ====================
  
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 'F');

  // Add decorative blue blobs (simplified without opacity for PDF compatibility)
  // Top-left blob
  pdf.setFillColor(147, 197, 253); // Lighter blue #93C5FD
  pdf.ellipse(0, 0, 15, 15, 'F');
  
  // Bottom-right blob
  pdf.setFillColor(59, 130, 246); // #3B82F6
  pdf.ellipse(CARD_WIDTH, CARD_HEIGHT, 18, 18, 'F');
  
  // Right accent blob
  pdf.setFillColor(191, 219, 254); // Very light blue #BFDBFE
  pdf.circle(CARD_WIDTH, CARD_HEIGHT / 2, 12, 'F');

  const centerX = CARD_WIDTH / 2;
  let yPos = 5;

  // Club logo - Top left
  const leftMargin = 5;
  if (clubSettings?.club_logo_url) {
    try {
      pdf.addImage(clubSettings.club_logo_url, 'PNG', leftMargin, yPos, 10, 10);
    } catch (error) {
      console.error('Error adding club logo:', error);
    }
  }

  // Sport title next to logo
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(217, 119, 6); // amber-600
  const titleX = leftMargin + 12;
  pdf.text('PATINADOR DE VELOCIDAD', titleX, yPos + 3);
  pdf.text('EN LÍNEA', titleX, yPos + 6);
  
  yPos += 12;

  // Athlete photo (centered)
  if (athlete.avatar_url) {
    try {
      const photoWidth = 18;
      const photoHeight = 24; // 3:4 aspect ratio
      pdf.addImage(athlete.avatar_url, 'JPEG', centerX - photoWidth / 2, yPos, photoWidth, photoHeight);
      yPos += photoHeight + 2;
    } catch (error) {
      console.error('Error adding athlete photo:', error);
      yPos += 2;
    }
  } else {
    yPos += 2;
  }

  // Athlete full name (large, bold, centered)
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59); // slate-800
  const fullName = `${athlete.first_name} ${athlete.last_name}`;
  pdf.text(fullName, centerX, yPos, { align: 'center' });
  yPos += 5;

  // Info Grid - 2 columns x 3 rows
  const col1X = 15;
  const col2X = 50;
  const rowHeight = 5;
  
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105); // slate-600

  // Row 1: RH and ID
  pdf.text('RH', col1X, yPos);
  pdf.text('ID', col2X, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59); // slate-800
  pdf.setFontSize(7);
  pdf.text(getBloodTypeDisplay(), col1X, yPos + 3);
  pdf.text(getIdDisplay(), col2X, yPos + 3);
  yPos += rowHeight;

  // Row 2: Liga and Club
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('LIGA', col1X, yPos);
  pdf.text('CLUB', col2X, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(7);
  pdf.text(clubSettings?.league || 'N/A', col1X, yPos + 3, { maxWidth: 30 });
  pdf.text(clubSettings?.club_name || 'N/A', col2X, yPos + 3, { maxWidth: 30 });
  yPos += rowHeight;

  // Row 3: Carnet and Válido
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('CARNET', col1X, yPos);
  pdf.text('VÁLIDO', col2X, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(7);
  pdf.text(athlete.athlete_number || 'N/A', col1X, yPos + 3);
  pdf.text(getValidityYear().toString(), col2X, yPos + 3);
  
  // ==================== BACK SIDE ====================
  
  pdf.addPage();

  // Dark blue gradient background (simulated with solid color)
  pdf.setFillColor(30, 58, 138); // indigo-900
  pdf.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 'F');

  // Add white decorative blobs (using lighter colors instead of opacity)
  pdf.setFillColor(59, 130, 246); // Slightly lighter blue for contrast
  pdf.ellipse(0, 0, 16, 16, 'F');
  
  pdf.setFillColor(79, 70, 229); // Indigo-600
  pdf.ellipse(CARD_WIDTH, CARD_HEIGHT, 20, 20, 'F');
  
  pdf.setFillColor(99, 102, 241); // Indigo-500
  pdf.circle(0, CARD_HEIGHT / 2, 14, 'F');

  yPos = 8;

  // Club Logo - Large and Centered
  if (clubSettings?.club_logo_url) {
    try {
      const logoSize = 22;
      pdf.addImage(clubSettings.club_logo_url, 'PNG', centerX - logoSize / 2, yPos, logoSize, logoSize);
      yPos += logoSize + 4;
    } catch (error) {
      console.error('Error adding club logo:', error);
      yPos += 4;
    }
  }

  // Decorative line
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.2);
  pdf.line(centerX - 20, yPos, centerX + 20, yPos);
  yPos += 4;

  // Certification message
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Este documento certifica que', centerX, yPos, { align: 'center' });
  yPos += 4;
  pdf.text('eres miembro activo del club', centerX, yPos, { align: 'center' });
  yPos += 6;

  // Club name - Large
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(clubSettings?.club_name || 'Club de Patinaje', centerX, yPos, { align: 'center', maxWidth: CARD_WIDTH - 10 });
  
  // QR Code - Small at bottom
  yPos = CARD_HEIGHT - 16;
  if (qrCodeUrl) {
    try {
      const qrSize = 12;
      // White background for QR code
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(centerX - qrSize / 2 - 1, yPos - 1, qrSize + 2, qrSize + 2, 1, 1, 'F');
      
      pdf.addImage(qrCodeUrl, 'PNG', centerX - qrSize / 2, yPos, qrSize, qrSize);
      yPos += qrSize + 2;
    } catch (error) {
      console.error('Error adding QR code:', error);
      yPos += 2;
    }
  }

  // Website URL - Small
  if (clubSettings?.website_url) {
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text(clubSettings.website_url, centerX, yPos, { align: 'center' });
  }
  
  // Save the PDF
  const fileName = `carnet_${athlete.first_name}_${athlete.last_name}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};
