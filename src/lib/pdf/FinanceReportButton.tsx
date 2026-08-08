import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FinanceReportData } from './FinanceReportDocument';

interface Props {
  data: FinanceReportData;
}

/**
 * Botón de exportación del reporte financiero en PDF. Importa
 * `@react-pdf/renderer` y el documento de forma DINÁMICA sólo al hacer clic,
 * para no cargar el bundle de react-pdf (~1.5 MB) al abrir el dashboard.
 */
export function FinanceReportDownloadButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [{ pdf }, { FinanceReportDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./FinanceReportDocument'),
      ]);
      const filename = `reporte_financiero_${data.period.replace(/\s/g, '_')}.pdf`;
      const blob = await pdf(<FinanceReportDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" disabled={loading} onClick={handleClick}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      {loading ? 'Generando…' : 'Exportar PDF'}
    </Button>
  );
}
