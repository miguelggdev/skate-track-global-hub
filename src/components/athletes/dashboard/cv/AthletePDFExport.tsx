import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateAge } from '@/utils/ageCalculations';
import { useToast } from '@/hooks/use-toast';

interface PDFData {
  athlete: {
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    category: string;
    level: string;
    club_name?: string | null;
    main_discipline?: string | null;
    bio?: string | null;
    personal_values?: string | null;
    short_term_goals?: string | null;
    long_term_goals?: string | null;
  };
  profile?: {
    city?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  kpis: {
    totalSessions: number;
    totalHours: number;
    competitionCount: number;
    medals: { gold: number; silver: number; bronze: number };
  };
  competitions: Array<{
    competitions: { name: string; start_date: string; location: string };
    position: number | null;
    medal_type: string | null;
  }>;
  medicalCounts: { physiotherapy: number; psychology: number; medical: number };
  socials?: {
    instagram?: string | null;
    facebook?: string | null;
  } | null;
}

interface AthletePDFExportProps {
  data: PDFData;
}

const AthletePDFExport: React.FC<AthletePDFExportProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    setLoading(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Helper functions
      const addSection = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 33, 33);
        doc.text(title, margin, y);
        y += 8;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      const addText = (label: string, value: string | null | undefined, inline = false) => {
        if (!value) return;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(`${label}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        
        const labelWidth = doc.getTextWidth(`${label}: `);
        const lines = doc.splitTextToSize(value, contentWidth - labelWidth - 5);
        doc.text(lines[0], margin + labelWidth, y);
        
        if (lines.length > 1) {
          for (let i = 1; i < lines.length; i++) {
            y += 5;
            doc.text(lines[i], margin, y);
          }
        }
        y += inline ? 0 : 6;
      };

      // Header
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 71, 187);
      doc.text('CV DEPORTIVO', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Athlete Name
      doc.setFontSize(18);
      doc.setTextColor(33, 33, 33);
      const fullName = `${data.athlete.first_name ?? ''} ${data.athlete.last_name ?? ''}`.trim();
      doc.text(fullName || 'Deportista', pageWidth / 2, y, { align: 'center' });
      y += 8;

      // Category and Age
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      const age = data.athlete.date_of_birth ? calculateAge(new Date(data.athlete.date_of_birth)) : null;
      const subtitle = [data.athlete.category, age ? `${age} años` : null, data.athlete.club_name].filter(Boolean).join(' | ');
      doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Personal Information
      addSection('Información Personal');
      addText('Fecha de Nacimiento', data.athlete.date_of_birth ? format(new Date(data.athlete.date_of_birth), 'dd MMMM yyyy', { locale: es }) : null);
      addText('Ubicación', [data.profile?.city, data.profile?.country].filter(Boolean).join(', ') || null);
      addText('Email', data.profile?.email);
      addText('Teléfono', data.profile?.phone);
      y += 4;

      // Sports Profile
      addSection('Perfil Deportivo');
      addText('Categoría', data.athlete.category);
      addText('Nivel', data.athlete.level);
      addText('Disciplina Principal', data.athlete.main_discipline);
      addText('Club', data.athlete.club_name);
      y += 4;

      // KPIs
      addSection('Indicadores de Rendimiento');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      
      const kpiText = [
        `Entrenamientos: ${data.kpis.totalSessions}`,
        `Horas: ${data.kpis.totalHours}h`,
        `Competencias: ${data.kpis.competitionCount}`,
        `Medallas: 🥇${data.kpis.medals.gold} 🥈${data.kpis.medals.silver} 🥉${data.kpis.medals.bronze}`
      ].join('   |   ');
      doc.text(kpiText, margin, y);
      y += 10;

      // Competitions
      if (data.competitions.length > 0) {
        addSection('Competencias Recientes');
        data.competitions.slice(0, 5).forEach(comp => {
          const medal = comp.medal_type === 'gold' ? '🥇' : comp.medal_type === 'silver' ? '🥈' : comp.medal_type === 'bronze' ? '🥉' : '';
          const position = comp.position ? `#${comp.position}` : '';
          doc.text(`${medal} ${comp.competitions.name} - ${comp.competitions.location} (${format(new Date(comp.competitions.start_date), 'MMM yyyy', { locale: es })}) ${position}`, margin, y);
          y += 5;
        });
        y += 4;
      }

      // Bio and Goals
      if (data.athlete.bio) {
        addSection('Biografía');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const bioLines = doc.splitTextToSize(data.athlete.bio, contentWidth);
        doc.text(bioLines, margin, y);
        y += bioLines.length * 5 + 4;
      }

      if (data.athlete.short_term_goals || data.athlete.long_term_goals) {
        addSection('Metas');
        addText('Corto Plazo', data.athlete.short_term_goals);
        addText('Largo Plazo', data.athlete.long_term_goals);
        y += 4;
      }

      // Medical Summary
      addSection('Resumen Médico');
      doc.setFontSize(10);
      doc.text(`Fisioterapia: ${data.medicalCounts.physiotherapy} sesiones | Psicología: ${data.medicalCounts.psychology} sesiones | Seguimiento: ${data.medicalCounts.medical} sesiones`, margin, y);
      y += 10;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, pageWidth / 2, 290, { align: 'center' });

      // Save
      const fileName = `CV_Deportivo_${fullName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error: any) {
      toast({
        title: "Error al generar el PDF",
        description: error.message || "No se pudo generar el CV deportivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={generatePDF} disabled={loading} className="gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Exportar CV (PDF)
    </Button>
  );
};

export default AthletePDFExport;
