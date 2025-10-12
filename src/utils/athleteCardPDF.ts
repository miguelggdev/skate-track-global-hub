import jsPDF from 'jspdf';
import { AthleteDetails } from '@/hooks/useAthleteDetails';
import { ClubSettings } from '@/hooks/useClubSettings';

const CARD_WIDTH = 85.6; // mm (ID-1 standard)
const CARD_HEIGHT = 53.98; // mm

export const generateAthleteCardPDF = async (
  athlete: AthleteDetails,
  clubSettings: ClubSettings
) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_WIDTH, CARD_HEIGHT],
  });

  // Helper function to calculate age
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      escuela: 'Escuela',
      menores: 'Menores',
      transicion: 'Transición',
      prejuvenil: 'Pre-Juvenil',
      juvenil: 'Juvenil',
      mayores: 'Mayores',
    };
    return labels[category] || category;
  };

  // ===== FRONT SIDE =====
  
  // Background gradient (simulated with rectangles)
  pdf.setFillColor(59, 130, 246); // Primary blue
  pdf.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 'F');
  
  // Header section
  pdf.setFillColor(255, 255, 255, 0.1);
  pdf.rect(0, 0, CARD_WIDTH, 12, 'F');
  
  // Club logo (if available)
  if (clubSettings.club_logo_url) {
    try {
      pdf.addImage(clubSettings.club_logo_url, 'PNG', 3, 2, 8, 8);
    } catch (error) {
      console.warn('Could not add club logo to PDF');
    }
  }
  
  // Club name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(clubSettings.club_name || 'Club', 13, 6);
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Carnet de Atleta', 13, 9.5);
  
  // Athlete photo placeholder (rectangle)
  pdf.setFillColor(255, 255, 255, 0.2);
  pdf.rect(5, 15, 18, 22, 'F');
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.3);
  pdf.rect(5, 15, 18, 22, 'S');
  
  // Athlete name
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${athlete.first_name} ${athlete.last_name}`, 25, 18);
  
  // Category and age
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Categoría: ${getCategoryLabel(athlete.category)}`, 25, 23);
  pdf.text(`Edad: ${calculateAge(athlete.date_of_birth)} años`, 25, 27);
  
  // Contact & Info box
  pdf.setFillColor(255, 255, 255, 0.1);
  pdf.rect(5, 39, CARD_WIDTH - 10, 12, 'F');
  
  let yPos = 43;
  pdf.setFontSize(7);
  
  if (athlete.phone) {
    pdf.text(`📞 ${athlete.phone}`, 7, yPos);
    yPos += 3;
  }
  
  if (athlete.email) {
    const emailText = athlete.email.length > 30 ? athlete.email.substring(0, 30) + '...' : athlete.email;
    pdf.text(`✉️  ${emailText}`, 7, yPos);
    yPos += 3;
  }
  
  if (athlete.body_info?.blood_type) {
    pdf.text(`🩸 Tipo de Sangre: ${athlete.body_info.blood_type}`, 7, yPos);
    yPos += 3;
  }
  
  if (athlete.id_number) {
    pdf.text(`🆔 ID: ${athlete.id_number}`, 45, 43);
  }
  
  if (athlete.history?.is_league) {
    pdf.text(`🏆 Liga: ${clubSettings.league || 'Sí'}`, 45, 46);
  }
  
  // Athlete number at bottom
  const athleteNumber = athlete.athlete_number || `ATH-${athlete.id.slice(0, 8).toUpperCase()}`;
  pdf.setFillColor(255, 255, 255, 0.2);
  pdf.rect(5, CARD_HEIGHT - 7, CARD_WIDTH - 10, 5, 'F');
  pdf.setFontSize(9);
  pdf.setFont('courier', 'bold');
  const numberWidth = pdf.getTextWidth(athleteNumber);
  pdf.text(athleteNumber, (CARD_WIDTH - numberWidth) / 2, CARD_HEIGHT - 3.5);
  
  // ===== BACK SIDE (new page) =====
  pdf.addPage([CARD_WIDTH, CARD_HEIGHT], 'landscape');
  
  // Background
  pdf.setFillColor(71, 85, 105); // Slate gray
  pdf.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 'F');
  
  // Header
  pdf.setFillColor(255, 255, 255, 0.1);
  pdf.rect(0, 0, CARD_WIDTH, 12, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Carnet de Atleta', CARD_WIDTH / 2, 7, { align: 'center' });
  
  let backYPos = 16;
  
  // Club Information
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMACIÓN DEL CLUB', 5, backYPos);
  backYPos += 3;
  
  pdf.setFillColor(255, 255, 255, 0.1);
  pdf.rect(5, backYPos, CARD_WIDTH - 10, 16, 'F');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  backYPos += 3;
  
  if (clubSettings.club_name) {
    pdf.text(`Nombre: ${clubSettings.club_name}`, 7, backYPos);
    backYPos += 2.5;
  }
  
  if (clubSettings.address) {
    const addressLines = pdf.splitTextToSize(clubSettings.address, CARD_WIDTH - 14);
    pdf.text(addressLines, 7, backYPos);
    backYPos += 2.5 * addressLines.length;
  }
  
  if (clubSettings.contact_phone) {
    pdf.text(`Teléfono: ${clubSettings.contact_phone}`, 7, backYPos);
    backYPos += 2.5;
  }
  
  if (clubSettings.contact_email) {
    const emailText = clubSettings.contact_email.length > 28 ? 
      clubSettings.contact_email.substring(0, 28) + '...' : clubSettings.contact_email;
    pdf.text(`Email: ${emailText}`, 7, backYPos);
    backYPos += 2.5;
  }
  
  if (clubSettings.website_url) {
    pdf.text(clubSettings.website_url, 7, backYPos);
  }
  
  backYPos = 36;
  
  // Emergency Contact
  if (athlete.emergency_contact_name || athlete.emergency_contact_phone) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('CONTACTO DE EMERGENCIA', 5, backYPos);
    backYPos += 3;
    
    pdf.setFillColor(255, 255, 255, 0.1);
    pdf.rect(5, backYPos, CARD_WIDTH - 10, 8, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    backYPos += 3;
    
    if (athlete.emergency_contact_name) {
      pdf.text(`Nombre: ${athlete.emergency_contact_name}`, 7, backYPos);
      backYPos += 2.5;
    }
    
    if (athlete.emergency_contact_phone) {
      pdf.text(`Teléfono: ${athlete.emergency_contact_phone}`, 7, backYPos);
    }
  }
  
  // Athlete Number box at bottom
  pdf.setFillColor(255, 255, 255, 0.2);
  pdf.rect(5, CARD_HEIGHT - 10, CARD_WIDTH - 10, 8, 'F');
  
  pdf.setFontSize(6);
  pdf.text('Número de Atleta', CARD_WIDTH / 2, CARD_HEIGHT - 7, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setFont('courier', 'bold');
  const backNumberWidth = pdf.getTextWidth(athleteNumber);
  pdf.text(athleteNumber, (CARD_WIDTH - backNumberWidth) / 2, CARD_HEIGHT - 4);
  
  pdf.setFontSize(5.5);
  pdf.setFont('helvetica', 'normal');
  const validText = `Válido desde: ${new Date(athlete.join_date).getFullYear()}`;
  pdf.text(validText, CARD_WIDTH / 2, CARD_HEIGHT - 1.5, { align: 'center' });
  
  // Save the PDF
  const fileName = `Carnet_${athlete.first_name}_${athlete.last_name}.pdf`;
  pdf.save(fileName);
};
