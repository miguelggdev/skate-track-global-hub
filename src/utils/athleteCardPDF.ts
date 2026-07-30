import jsPDF from 'jspdf';
import { AthleteDetails } from '@/hooks/useAthleteDetails';
import { ClubSettings } from '@/hooks/useClubSettings';

export const generateAthleteCardPDF = async (
  athlete: AthleteDetails,
  clubSettings: ClubSettings | null
) => {
  const cardWidth = 85.6; // mm - ID-1 standard
  const cardHeight = 53.98; // mm
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [cardWidth, cardHeight],
  });

  // Helper functions
  const getIdDisplay = () => {
    if (!athlete.id_number) return 'N/A';
    const idType = athlete.id_type?.toUpperCase() || 'ID';
    return `${idType} ${athlete.id_number}`;
  };

  const getBloodTypeDisplay = () => {
    return athlete.body_info?.blood_type || 'N/A';
  };

  // FRONT SIDE
  // Blue Header Section (30% height)
  const headerHeight = cardHeight * 0.3;
  pdf.setFillColor(0, 71, 187); // #0047BB
  pdf.rect(0, 0, cardWidth, headerHeight, 'F');

  // Speed lines decoration (left)
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.3);
  pdf.line(5, headerHeight / 2 - 2, 12, headerHeight / 2 - 2);
  pdf.line(4, headerHeight / 2, 14, headerHeight / 2);
  pdf.line(5, headerHeight / 2 + 2, 12, headerHeight / 2 + 2);

  // Speed lines decoration (right)
  pdf.line(cardWidth - 12, headerHeight / 2 - 2, cardWidth - 5, headerHeight / 2 - 2);
  pdf.line(cardWidth - 14, headerHeight / 2, cardWidth - 4, headerHeight / 2);
  pdf.line(cardWidth - 12, headerHeight / 2 + 2, cardWidth - 5, headerHeight / 2 + 2);

  // Title text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DEPORTISTA PATINAJE', cardWidth / 2, headerHeight / 2 - 2, { align: 'center' });
  
  pdf.setTextColor(227, 30, 36); // #E31E24
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DE VELOCIDAD EN LÍNEA', cardWidth / 2, headerHeight / 2 + 2.5, { align: 'center' });

  // White Body Section (60% height)
  const bodyStartY = headerHeight;
  const bodyHeight = cardHeight * 0.6;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, bodyStartY, cardWidth, bodyHeight, 'F');

  // Photo with red border
  const photoX = 8;
  const photoY = bodyStartY + 4;
  const photoSize = 18;
  
  // Red border for photo
  pdf.setFillColor(227, 30, 36); // #E31E24
  pdf.rect(photoX - 0.5, photoY - 0.5, photoSize + 1, photoSize + 1, 'F');
  
  if (athlete.avatar_url) {
    try {
      pdf.addImage(athlete.avatar_url, 'JPEG', photoX, photoY, photoSize, photoSize);
    } catch (error) {
      // Fallback: draw a placeholder
      pdf.setFillColor(0, 71, 187);
      pdf.rect(photoX, photoY, photoSize, photoSize, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text(
        `${athlete.first_name?.[0] || ''}${athlete.last_name?.[0] || ''}`,
        photoX + photoSize / 2,
        photoY + photoSize / 2 + 1,
        { align: 'center' }
      );
    }
  } else {
    // Photo placeholder
    pdf.setFillColor(0, 71, 187);
    pdf.rect(photoX, photoY, photoSize, photoSize, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      `${athlete.first_name?.[0] || ''}${athlete.last_name?.[0] || ''}`,
      photoX + photoSize / 2,
      photoY + photoSize / 2 + 1,
      { align: 'center' }
    );
  }

  // Athlete name (large, uppercase, centered)
  const nameY = bodyStartY + 6;
  pdf.setTextColor(0, 31, 84); // #001F54
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim().toUpperCase();
  pdf.text(fullName, cardWidth / 2, nameY, { align: 'center' });

  // Information fields with underlines
  const infoStartY = nameY + 5;
  const infoX = photoX + photoSize + 4;
  const lineHeight = 4.5;
  const lineWidth = cardWidth - infoX - 18;

  pdf.setFontSize(6);
  
  // Field 1: RH blood type
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128); // #6B7280
  pdf.text('RH blood type', infoX, infoStartY);
  pdf.setDrawColor(209, 213, 219);
  pdf.setLineWidth(0.1);
  pdf.line(infoX + 18, infoStartY + 0.5, infoX + lineWidth, infoStartY + 0.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 31, 84);
  pdf.setFontSize(7);
  pdf.text(getBloodTypeDisplay(), infoX + 19, infoStartY);

  // Field 2: ID
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Documento de Identidad (ID)', infoX, infoStartY + lineHeight);
  pdf.line(infoX + 35, infoStartY + lineHeight + 0.5, infoX + lineWidth, infoStartY + lineHeight + 0.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 31, 84);
  pdf.setFontSize(7);
  pdf.text(getIdDisplay(), infoX + 36, infoStartY + lineHeight, { maxWidth: lineWidth - 36 });

  // Field 3: League
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Liga (League)', infoX, infoStartY + lineHeight * 2);
  pdf.line(infoX + 18, infoStartY + lineHeight * 2 + 0.5, infoX + lineWidth, infoStartY + lineHeight * 2 + 0.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 31, 84);
  pdf.setFontSize(7);
  pdf.text(clubSettings?.league || 'N/A', infoX + 19, infoStartY + lineHeight * 2, { maxWidth: lineWidth - 19 });

  // Field 4: Club
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Club', infoX, infoStartY + lineHeight * 3);
  pdf.line(infoX + 8, infoStartY + lineHeight * 3 + 0.5, infoX + lineWidth, infoStartY + lineHeight * 3 + 0.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 31, 84);
  pdf.setFontSize(7);
  pdf.text(clubSettings?.club_name || 'N/A', infoX + 9, infoStartY + lineHeight * 3, { maxWidth: lineWidth - 9 });

  // Red Footer Section (10% height)
  const footerStartY = bodyStartY + bodyHeight;
  const footerHeight = cardHeight * 0.1;
  pdf.setFillColor(227, 30, 36); // #E31E24
  pdf.rect(0, footerStartY, cardWidth, footerHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text(
    `Numero ID del Deportista: ${athlete.athlete_number || 'N/A'}`,
    cardWidth / 2,
    footerStartY + footerHeight / 2 + 1,
    { align: 'center' }
  );

  // BACK SIDE - Add new page
  pdf.addPage();

  // Background with gradient effect (simulated with rectangles)
  pdf.setFillColor(30, 41, 59);
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');
  
  // Darker gradient at top
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, cardWidth, cardHeight / 3, 'F');
  
  // Lighter gradient at bottom
  pdf.setFillColor(51, 65, 85);
  pdf.rect(0, cardHeight * 2 / 3, cardWidth, cardHeight / 3, 'F');

  // Decorative white shapes (lighter blue for contrast)
  pdf.setFillColor(59, 130, 246);
  pdf.circle(cardWidth - 15, 12, 10, 'F');
  pdf.circle(10, cardHeight - 10, 12, 'F');

  // Club logo (centered, large)
  const logoSize = 22;
  const logoX = (cardWidth - logoSize) / 2;
  const logoY = 10;

  if (clubSettings?.club_logo_url) {
    try {
      pdf.addImage(clubSettings.club_logo_url, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
    }
  }

  // Divider line
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.2);
  pdf.line(cardWidth / 2 - 18, logoY + logoSize + 3, cardWidth / 2 + 18, logoY + logoSize + 3);

  // Certification message
  const messageY = logoY + logoSize + 8;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  const certMessage = 'Este documento certifica que eres';
  const certMessage2 = 'miembro activo del club';
  pdf.text(certMessage, cardWidth / 2, messageY, { align: 'center' });
  pdf.text(certMessage2, cardWidth / 2, messageY + 3.5, { align: 'center' });

  // Club name (large)
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(clubSettings?.club_name || 'Club Name', cardWidth / 2, messageY + 10, { 
    align: 'center',
    maxWidth: cardWidth - 10
  });

  // Save PDF
  const fileName = `carnet_${athlete.first_name}_${athlete.last_name}_${Date.now()}.pdf`;
  pdf.save(fileName);
};
