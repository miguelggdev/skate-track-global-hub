import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useCompetitionPDFData } from '@/hooks/useCompetitions';
import jsPDF from 'jspdf';
import { useReportTemplate } from '@/hooks/useReportTemplate';

interface CompetitionPDFReportProps {
  competitionId: string;
  competitionName: string;
}

export const CompetitionPDFReport: React.FC<CompetitionPDFReportProps> = ({
  competitionId,
  competitionName,
}) => {
  const [generating, setGenerating] = useState(false);
  const { data: pdfData, isLoading } = useCompetitionPDFData(competitionId);
  const { createReportTemplate } = useReportTemplate();

  const generatePDF = async () => {
    if (!pdfData) {
      toast.error('Competition data not available');
      return;
    }

    setGenerating(true);
    
    try {
      const pdf = new jsPDF();
      
      // Create report template with club configuration
      const template = await createReportTemplate(pdf);
      
      // Generate professional header
      let yPosition = template.generateHeader();
      yPosition += 10;

      // Report title
      yPosition = template.addTitle('REPORTE DE COMPETICIÓN', 16);
      yPosition = template.addSpace(10);

      // Competition Info
      yPosition = template.addText(`COMPETICIÓN: ${pdfData.competition.name}`, 12);
      yPosition = template.addText(`FECHA: ${new Date().toLocaleDateString('es-ES')}`, 11);
      yPosition = template.addSpace(15);

      // Athletes Data
      yPosition = template.addText('DATOS DE ATLETAS:', 14);
      yPosition = template.addSpace(5);

      // DAMAS Section
      if (pdfData.damas.length > 0) {
        yPosition = template.addText('DAMAS (ordenadas por edad, de menor a mayor):', 12);
        pdfData.damas.forEach((athlete, index) => {
          const athleteInfo = `${index + 1}. ${athlete.first_name} ${athlete.last_name} - ${athlete.age} años - ${athlete.category}/${athlete.level}`;
          yPosition = template.addText(athleteInfo, 10);
          
          // Check for page break
          if (yPosition > pdf.internal.pageSize.height - 60) {
            pdf.addPage();
            yPosition = 40;
          }
        });
        yPosition = template.addSpace(10);
      }

      // VARONES Section
      if (pdfData.varones.length > 0) {
        yPosition = template.addText('VARONES (ordenados por edad, de menor a mayor):', 12);
        pdfData.varones.forEach((athlete, index) => {
          const athleteInfo = `${index + 1}. ${athlete.first_name} ${athlete.last_name} - ${athlete.age} años - ${athlete.category}/${athlete.level}`;
          yPosition = template.addText(athleteInfo, 10);
          
          // Check for page break
          if (yPosition > pdf.internal.pageSize.height - 60) {
            pdf.addPage();
            yPosition = 40;
          }
        });
      }

      // No athletes case
      if (pdfData.damas.length === 0 && pdfData.varones.length === 0) {
        yPosition = template.addText('No hay atletas registrados para esta competición.', 11);
      }

      // Generate footer with club information and signatures
      template.generateFooter();

      // Save the PDF
      const filename = `${competitionName.replace(/[^a-z0-9]/gi, '_')}_report.pdf`;
      pdf.save(filename);
      
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={generatePDF}
      disabled={isLoading || generating || !pdfData}
      className="flex items-center gap-1"
    >
      {generating ? (
        <Download className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {generating ? 'Generating...' : 'PDF Report'}
    </Button>
  );
};