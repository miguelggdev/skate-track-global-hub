import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useCompetitionPDFData } from '@/hooks/useCompetitions';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CompetitionReportView } from './CompetitionReportView';
import { createRoot } from 'react-dom/client';

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
      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1200px';
      container.style.background = 'white';
      document.body.appendChild(container);

      // Render the report component
      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(
          <div style={{ background: 'white', padding: '40px' }}>
            <CompetitionReportView 
              data={{
                competition: pdfData.competition,
                damas: pdfData.damas,
                varones: pdfData.varones,
                medalResults: pdfData.medalResults,
                allResults: pdfData.allResults,
                medalStats: pdfData.medalStats,
                clubInfo: {
                  club_name: pdfData.clubSettings?.club_name,
                  logo_url: pdfData.clubSettings?.club_logo_url,
                  email: pdfData.clubSettings?.contact_email,
                  address: pdfData.clubSettings?.address,
                }
              }}
            />
          </div>
        );
        // Wait for rendering to complete
        setTimeout(resolve, 500);
      });

      // Capture the rendered content as canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Clean up
      root.unmount();
      document.body.removeChild(container);

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= 297; // A4 height

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
        heightLeft -= 297;
      }

      // Save the PDF
      const filename = `${competitionName.replace(/[^a-z0-9]/gi, '_')}_report.pdf`;
      pdf.save(filename);
      
      toast.success('PDF report generated successfully!');
    } catch (error) {
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