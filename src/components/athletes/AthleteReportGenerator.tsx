import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useAllAthletes } from '@/hooks/useAllAthletes';
import { useReportTemplate } from '@/hooks/useReportTemplate';
import { generateAthleteExcel, generateAthletePDF } from '@/utils/athleteExportUtils';
import { useToast } from '@/hooks/use-toast';

const AthleteReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: athletes, isLoading } = useAllAthletes();
  const { clubInfo, reportSettings, loading: clubLoading } = useReportTemplate();
  const { toast } = useToast();

  const handleExcelExport = async () => {
    if (!athletes || athletes.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay atletas para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      await generateAthleteExcel(athletes, clubInfo);
      toast({
        title: "Éxito",
        description: "Reporte Excel generado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte Excel",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePDFExport = async () => {
    if (!athletes || athletes.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay atletas para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      await generateAthletePDF(athletes, clubInfo, reportSettings);
      toast({
        title: "Éxito",
        description: "Reporte PDF generado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = isLoading || clubLoading || isGenerating || !athletes?.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="toggle-primary"
          className="text-sm"
          disabled={isDisabled}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar Reporte
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcelExport} disabled={isDisabled}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDFExport} disabled={isDisabled}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AthleteReportGenerator;