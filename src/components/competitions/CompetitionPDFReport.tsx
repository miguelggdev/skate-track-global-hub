import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useCompetitionPDFData } from '@/hooks/useCompetitions';
import jsPDF from 'jspdf';

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

  const generatePDF = async () => {
    if (!pdfData) {
      toast.error('Competition data not available');
      return;
    }

    setGenerating(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with line breaks
      const addText = (text: string, fontSize = 10, isBold = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 5;
        
        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.height - margin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Title
      addText(`COMPETITION REPORT`, 16, true);
      yPosition += 10;

      // Competition Info
      addText(`COMPETITION NAME: ${pdfData.competition.name}`, 12, true);
      addText(`CLUB: ${pdfData.clubSettings?.club_name || 'N/A'}`);
      addText(`LEAGUE: ${pdfData.clubSettings?.league || 'N/A'}`);
      
      yPosition += 10;

      // President Info
      addText(`PRESIDENT: ${pdfData.clubSettings?.president_name || 'N/A'}`);
      addText(`ID: ${pdfData.clubSettings?.president_id || 'N/A'}`);
      addText(`PHONE: ${pdfData.clubSettings?.president_phone || 'N/A'}`);
      addText(`EMAIL: ${pdfData.clubSettings?.president_email || 'N/A'}`);
      
      yPosition += 10;

      // Delegate Info
      addText(`DELEGATE: ${pdfData.clubSettings?.delegate_name || 'N/A'}`);
      addText(`DELEGATE PHONE: ${pdfData.clubSettings?.delegate_phone || 'N/A'}`);
      
      yPosition += 10;

      // Coach Info
      addText(`COACH: ${pdfData.clubSettings?.coach_name || 'N/A'}`);
      addText(`COACH PHONE: ${pdfData.clubSettings?.coach_phone || 'N/A'}`);
      
      yPosition += 15;

      // Athletes Data
      addText(`ATHLETE DATA:`, 14, true);
      yPosition += 5;

      // DAMAS Section
      if (pdfData.damas.length > 0) {
        addText(`DAMAS (ordered by age, youngest first):`, 12, true);
        pdfData.damas.forEach((athlete, index) => {
          const athleteInfo = `${index + 1}. ${athlete.first_name} ${athlete.last_name} - ${athlete.age} años - ${athlete.category}/${athlete.level}`;
          addText(athleteInfo);
        });
        yPosition += 10;
      }

      // VARONES Section
      if (pdfData.varones.length > 0) {
        addText(`VARONES (ordered by age, youngest first):`, 12, true);
        pdfData.varones.forEach((athlete, index) => {
          const athleteInfo = `${index + 1}. ${athlete.first_name} ${athlete.last_name} - ${athlete.age} años - ${athlete.category}/${athlete.level}`;
          addText(athleteInfo);
        });
      }

      // No athletes case
      if (pdfData.damas.length === 0 && pdfData.varones.length === 0) {
        addText('No athletes registered for this competition.');
      }

      // Footer
      yPosition += 20;
      addText(`Generated on: ${new Date().toLocaleDateString('es-ES')}`, 8);

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