import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { AthleteReportData } from '@/hooks/useAllAthletes';
import { ClubInfo, ReportSettings, ReportTemplateGenerator } from './reportTemplateGenerator';

// Excel export function
export const generateAthleteExcel = async (athletes: AthleteReportData[], clubInfo: ClubInfo) => {
  try {
    // Prepare data for Excel
    const excelData = athletes.map(athlete => ({
      'Nombre Completo': `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim(),
      'Número de Atleta': athlete.athlete_number || '',
      'Categoría': athlete.category || '',
      'Nivel': athlete.level || '',
      'Fecha de Nacimiento': athlete.date_of_birth ? 
        new Date(athlete.date_of_birth).toLocaleDateString('es-ES') : '',
      'Género': athlete.gender || '',
      'Tipo de Documento': athlete.id_type || '',
      'Número de Documento': athlete.id_number || '',
      'Teléfono': athlete.phone || '',
      'Email': athlete.email || '',
      'Fecha de Ingreso': athlete.join_date ? 
        new Date(athlete.join_date).toLocaleDateString('es-ES') : '',
      'Estado': athlete.status || '',
      'Contacto de Emergencia': athlete.emergency_contact_name || '',
      'Teléfono de Emergencia': athlete.emergency_contact_phone || '',
      'Notas Médicas': athlete.medical_notes || '',
      'Logros': athlete.achievements || '',
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
      ['Nombre del Club', clubInfo.club_name || ''],
      ['Dirección', clubInfo.address || ''],
      ['Teléfono', clubInfo.contact_phone || ''],
      ['Email', clubInfo.contact_email || ''],
      ['Sitio Web', clubInfo.website_url || ''],
      ['Liga', clubInfo.league || ''],
      ['País', clubInfo.country || ''],
      ['Presidente', clubInfo.president_name || ''],
      ['Teléfono Presidente', clubInfo.president_phone || ''],
      ['Email Presidente', clubInfo.president_email || ''],
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
    console.error('Error generating Excel file:', error);
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

    // Table configuration
    const pageWidth = 297; // A4 landscape width
    const margin = 20;
    const tableWidth = pageWidth - (margin * 2);
    
    // Column definitions
    const columns = [
      { header: 'Nombre', width: 35 },
      { header: 'Categoría', width: 20 },
      { header: 'Nivel', width: 25 },
      { header: 'F. Nacimiento', width: 25 },
      { header: 'Tipo ID', width: 20 },
      { header: 'Núm. ID', width: 30 },
      { header: 'Teléfono', width: 25 },
      { header: 'Email', width: 45 },
      { header: 'Estado', width: 20 },
      { header: 'F. Ingreso', width: 25 }
    ];

    // Draw table header
    let x = margin;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(8, 145, 178); // Primary color
    doc.setTextColor(255, 255, 255);
    
    columns.forEach(col => {
      doc.rect(x, currentY, col.width, 8, 'F');
      doc.text(col.header, x + 2, currentY + 5);
      x += col.width;
    });
    
    currentY += 8;
    
    // Draw table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    athletes.forEach((athlete, index) => {
      // Check if we need a new page
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;
        
        // Redraw header on new page
        x = margin;
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(8, 145, 178);
        doc.setTextColor(255, 255, 255);
        
        columns.forEach(col => {
          doc.rect(x, currentY, col.width, 8, 'F');
          doc.text(col.header, x + 2, currentY + 5);
          x += col.width;
        });
        
        currentY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
      }
      
      // Alternate row colors
      if (index % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, currentY, tableWidth, 6, 'F');
      }
      
      // Row data
      const rowData = [
        `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim(),
        athlete.category || '',
        athlete.level || '',
        athlete.date_of_birth ? new Date(athlete.date_of_birth).toLocaleDateString('es-ES') : '',
        athlete.id_type || '',
        athlete.id_number || '',
        athlete.phone || '',
        athlete.email || '',
        athlete.status || '',
        athlete.join_date ? new Date(athlete.join_date).toLocaleDateString('es-ES') : ''
      ];
      
      x = margin;
      rowData.forEach((data, colIndex) => {
        const text = String(data).substring(0, 15); // Truncate long text
        doc.text(text, x + 2, currentY + 4);
        x += columns[colIndex].width;
      });
      
      currentY += 6;
    });
    
    // Generate footer on last page
    generator.generateFooter();
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Reporte_Atletas_${clubInfo.club_name || 'Club'}_${timestamp}.pdf`;
    
    // Save the PDF
    doc.save(filename);

  } catch (error) {
    console.error('Error generating PDF file:', error);
    throw error;
  }
};