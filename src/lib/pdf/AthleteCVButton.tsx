import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CVData } from './AthleteCVDocument';

interface Props {
  data: CVData;
  filename?: string;
}

/**
 * Botón de descarga del CV en PDF. Importa `@react-pdf/renderer` y el documento
 * de forma DINÁMICA sólo al hacer clic, para no cargar el bundle de react-pdf
 * (~1.5 MB) al abrir el dashboard.
 */
export function AthleteCVDownloadButton({ data, filename }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [{ pdf }, { AthleteCVDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./AthleteCVDocument'),
      ]);
      const name = `${data.athlete.first_name ?? ''}_${data.athlete.last_name ?? ''}`.replace(/\s+/g, '_');
      const file = filename ?? `CV_${name}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const blob = await pdf(<AthleteCVDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file;
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
      {loading ? 'Generando PDF…' : 'CV PDF'}
    </Button>
  );
}
