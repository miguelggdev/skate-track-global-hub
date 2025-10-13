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

  // Club logo
  if (clubSettings?.club_logo_url) {
    try {
      pdf.addImage(clubSettings.club_logo_url, 'PNG', centerX - 6, yPos, 12, 12);
      yPos += 14;
    } catch (error) {
      console.error('Error adding club logo:', error);
      yPos += 2;
    }
  }

  // Athlete photo (if available)
  if (athlete.avatar_url) {
    try {
      const photoWidth = 20;
      const photoHeight = 26.67; // 3:4 aspect ratio
      pdf.addImage(athlete.avatar_url, 'JPEG', centerX - photoWidth / 2, yPos, photoWidth, photoHeight);
      yPos += photoHeight + 3;
    } catch (error) {
      console.error('Error adding athlete photo:', error);
      yPos += 3;
    }
  } else {
    yPos += 3;
  }

  // Athlete name (large, bold, dark)
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59); // slate-800
  const fullName = `${athlete.first_name} ${athlete.last_name}`;
  pdf.text(fullName, centerX, yPos, { align: 'center' });
  yPos += 5;

  // Category
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.text(`Categoría: ${getCategoryLabel(athlete.category)}`, centerX, yPos, { align: 'center' });
  yPos += 5;

  // ID Number
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85); // slate-700
  const idNumber = athlete.athlete_number || athlete.id?.slice(0, 8) || 'N/A';
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tarjeta de identidad: ', centerX - 15, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(idNumber, centerX + 15, yPos, { align: 'center' });
  yPos += 4;

  // Phone
  if (athlete.phone) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Teléfono: ', centerX - 10, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(athlete.phone, centerX + 10, yPos, { align: 'center' });
    yPos += 4;
  }

  // Validity
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.text(`Válido ${athlete.first_name?.toLowerCase()}: ${getValidityYear()}`, centerX, yPos, { align: 'center' });
  
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

  yPos = 10;

  // QR Code (centered, in white circle area)
  if (qrCodeUrl) {
    try {
      const qrSize = 25;
      // White background circle for QR code
      pdf.setFillColor(255, 255, 255);
      pdf.circle(centerX, yPos + qrSize / 2, qrSize / 2 + 3, 'F');
      
      pdf.addImage(qrCodeUrl, 'PNG', centerX - qrSize / 2, yPos, qrSize, qrSize);
      yPos += qrSize + 6;
    } catch (error) {
      console.error('Error adding QR code:', error);
      yPos += 6;
    }
  }

  // Website URL
  if (clubSettings?.website_url) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text(clubSettings.website_url, centerX, yPos, { align: 'center' });
    yPos += 5;
  }

  // Decorative dots
  pdf.setFontSize(6);
  pdf.text('• • • • • • • • • •', centerX, yPos, { align: 'center' });
  yPos += 4;

  // Disclaimer text
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  const disclaimer = 'Este carné es personal e intransferible y todas las';
  const disclaimer2 = 'acciones realizadas con el carné se entiende su titular.';
  pdf.text(disclaimer, centerX, yPos, { align: 'center', maxWidth: CARD_WIDTH - 10 });
  yPos += 3;
  pdf.text(disclaimer2, centerX, yPos, { align: 'center', maxWidth: CARD_WIDTH - 10 });

  // Club name at bottom
  yPos = CARD_HEIGHT - 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(clubSettings?.club_name || 'Club de Patinaje', centerX, yPos, { align: 'center' });
  
  // Save the PDF
  const fileName = `carnet_${athlete.first_name}_${athlete.last_name}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};
