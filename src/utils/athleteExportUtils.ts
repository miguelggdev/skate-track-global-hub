import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { AthleteReportData } from '@/hooks/useAllAthletes';
import { ClubInfo, ReportSettings, ReportTemplateGenerator } from './reportTemplateGenerator';

// Excel export function
export const generateAthleteExcel = async (athletes: AthleteReportData[], clubInfo: ClubInfo) => {
  try {
    // Prepare data for Excel
    const excelData = athletes.map(athlete => ({
      'Nombre Completo': `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim(),
      'Número de Atleta': athlete.athlete_number ?? '',
      'Categoría': athlete.category ?? '',
      'Nivel': athlete.level ?? '',
      'Fecha de Nacimiento': athlete.date_of_birth ? 
        new Date(athlete.date_of_birth).toLocaleDateString('es-ES') : '',
      'Género': athlete.gender ?? '',
      'Tipo de Documento': athlete.id_type ?? '',
      'Número de Documento': athlete.id_number ?? '',
      'Teléfono': athlete.phone ?? '',
      'Email': athlete.email ?? '',
      'Fecha de Ingreso': athlete.join_date ? 
        new Date(athlete.join_date).toLocaleDateString('es-ES') : '',
      'Estado': athlete.status ?? '',
      'Contacto de Emergencia': athlete.emergency_contact_name ?? '',
      'Teléfono de Emergencia': athlete.emergency_contact_phone ?? '',
      'Notas Médicas': athlete.medical_notes ?? '',
      'Logros': athlete.achievements ?? '',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Nombre Completo
      { wch: 15 }, // Número de Atleta
      { wch: 15 }, // Categoría
      { wch: 15 }, // Nivel
      { wch: 15 }, // Fecha de Nacimiento
      { wch: 10 }, // Género
      { wch: 15 }, // Tipo de Documento
      { wch: 20 }, // Número de Documento
      { wch: 15 }, // Teléfono
      { wch: 25 }, // Email
      { wch: 15 }, // Fecha de Ingreso
      { wch: 10 }, // Estado
      { wch: 25 }, // Contacto de Emergencia
      { wch: 20 }, // Teléfono de Emergencia
      { wch: 30 }, // Notas Médicas
      { wch: 30 }, // Logros
    ];
    worksheet['!cols'] = columnWidths;

    // Add header row styling
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "0891B2" } },
          alignment: { horizontal: "center" }
        };
      }
    }

    // Add club information as a separate sheet
    const clubInfoData = [
      ['INFORMACIÓN DEL CLUB'],
      ['Nombre del Club', clubInfo.club_name ?? ''],
      ['Dirección', clubInfo.address ?? ''],
      ['Teléfono', clubInfo.contact_phone ?? ''],
      ['Email', clubInfo.contact_email ?? ''],
      ['Sitio Web', clubInfo.website_url ?? ''],
      ['Liga', clubInfo.league ?? ''],
      ['País', clubInfo.country ?? ''],
      ['Presidente', clubInfo.president_name ?? ''],
      ['Teléfono Presidente', clubInfo.president_phone ?? ''],
      ['Email Presidente', clubInfo.president_email ?? ''],
      [''],
      ['RESUMEN ESTADÍSTICO'],
      ['Total de Atletas', athletes.length],
      ['Fecha de Generación', new Date().toLocaleDateString('es-ES')],
    ];

    const clubSheet = XLSX.utils.aoa_to_sheet(clubInfoData);
    clubSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Atletas');
    XLSX.utils.book_append_sheet(workbook, clubSheet, 'Información del Club');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Reporte_Atletas_${clubInfo.club_name || 'Club'}_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    throw error;
  }
};

// PDF export function
export const generateAthletePDF = async (
  athletes: AthleteReportData[], 
  clubInfo: ClubInfo, 
  reportSettings: ReportSettings
) => {
  try {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Create report template generator
    const generator = new ReportTemplateGenerator(doc, clubInfo, reportSettings);
    await generator.loadLogo();
    
    // Generate header
    let currentY = generator.generateHeader();
    
    // Add report title
    currentY = generator.addTitle('REPORTE DE ATLETAS', 18);
    currentY = generator.addSpace(10);
    
    // Add generation date
    currentY = generator.addText(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 10);
    currentY = generator.addText(`Total de atletas: ${athletes.length}`, 10);
    currentY = generator.addSpace(10);

    // Table configuration with improved styling
    const pageWidth = 297; // A4 landscape width
    const margin = 15;
    const tableWidth = pageWidth - (margin * 2);
    
    // Column definitions with optimized widths
    const columns = [
      { header: 'Nombre', width: 38 },
      { header: 'Categoría', width: 22 },
      { header: 'Nivel', width: 25 },
      { header: 'F. Nacimiento', width: 28 },
      { header: 'Tipo ID', width: 22 },
      { header: 'Número ID', width: 32 },
      { header: 'Teléfono', width: 28 },
      { header: 'Email', width: 48 },
      { header: 'Estado', width: 22 },
      { header: 'F. Ingreso', width: 28 }
    ];

    // Professional table header
    let x = margin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Header background with gradient effect
    doc.setFillColor(8, 145, 178);
    doc.rect(margin, currentY, tableWidth, 12, 'F');
    
    // Header accent line
    doc.setFillColor(6, 120, 145);
    doc.rect(margin, currentY, tableWidth, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    
    columns.forEach(col => {
      // Center-align headers
      const centerX = x + (col.width / 2);
      doc.text(col.header, centerX, currentY + 8, { align: 'center' });
      x += col.width;
    });
    
    currentY += 12;
    
    // Draw table rows with enhanced styling
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(31, 31, 31);
    
    athletes.forEach((athlete, index) => {
      // Check if we need a new page
      if (currentY > 170) {
        doc.addPage();
        currentY = 20;
        
        // Redraw professional header on new page
        x = margin;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setFillColor(8, 145, 178);
        doc.rect(margin, currentY, tableWidth, 12, 'F');
        doc.setFillColor(6, 120, 145);
        doc.rect(margin, currentY, tableWidth, 2, 'F');
        doc.setTextColor(255, 255, 255);
        
        columns.forEach(col => {
          const centerX = x + (col.width / 2);
          doc.text(col.header, centerX, currentY + 8, { align: 'center' });
          x += col.width;
        });
        
        currentY += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(31, 31, 31);
      }
      
      // Enhanced alternating row colors
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, tableWidth, 8, 'F');
      }
      
      // Row data with better formatting
      const rowData = [
        `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim(),
        athlete.category ?? '',
        athlete.level ?? '',
        athlete.date_of_birth ? new Date(athlete.date_of_birth).toLocaleDateString('es-ES') : '',
        athlete.id_type ?? '',
        athlete.id_number ?? '',
        athlete.phone ?? '',
        athlete.email ?? '',
        athlete.status ?? '',
        athlete.join_date ? new Date(athlete.join_date).toLocaleDateString('es-ES') : ''
      ];
      
      x = margin;
      rowData.forEach((data, colIndex) => {
        let text = String(data);
        // Smart text truncation based on column width
        const maxLength = Math.floor(columns[colIndex].width / 2.5);
        if (text.length > maxLength) {
          text = text.substring(0, maxLength - 2) + '..';
        }
        
        // Better text positioning
        doc.text(text, x + 2, currentY + 5.5);
        x += columns[colIndex].width;
      });
      
      currentY += 8;
    });
    
    // Generate footer on last page
    generator.generateFooter();
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Reporte_Atletas_${clubInfo.club_name || 'Club'}_${timestamp}.pdf`;
    
    // Save the PDF
    doc.save(filename);

  } catch (error) {
    throw error;
  }
};