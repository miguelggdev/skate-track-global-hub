import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AthleteCard } from './AthleteCard';
import { useAthleteDetails } from '@/hooks/useAthleteDetails';
import { useClubSettings } from '@/hooks/useClubSettings';
import { generateAthleteCardPDF } from '@/utils/athleteCardPDF';
import { useSaveDocument } from '@/hooks/useDocumentGeneration';
import { toast } from 'sonner';

interface AthleteCardDialogProps {
  athleteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AthleteCardDialog = ({ athleteId, open, onOpenChange }: AthleteCardDialogProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: athlete, isLoading: athleteLoading } = useAthleteDetails(athleteId);
  const { data: clubSettings, isLoading: clubLoading } = useClubSettings();
  const saveDoc = useSaveDocument();

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDownload = async () => {
    if (!athlete || !clubSettings) {
      toast.error('No se pudo generar el carnet');
      return;
    }

    setIsDownloading(true);
    try {
      await generateAthleteCardPDF(athlete, clubSettings);
      await saveDoc.mutateAsync({
        title: `Carnet — ${athlete.first_name} ${athlete.last_name} ${new Date().getFullYear()}`,
        document_type: 'carnet_deportista',
        athlete_id: athlete.id,
        notes: `Año ${new Date().getFullYear()}`,
      });
      toast.success('Carnet descargado exitosamente');
    } catch (error) {
      toast.error('Error al generar el carnet');
    } finally {
      setIsDownloading(false);
    }
  };

  const isLoading = athleteLoading || clubLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Carnet de Atleta</span>
            <Button
              onClick={handleDownload}
              disabled={isDownloading || isLoading || !athlete}
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center py-8">
          {isLoading ? (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Cargando información...</p>
            </div>
          ) : athlete ? (
            <div className="w-full max-w-2xl" style={{ aspectRatio: '85.6 / 53.98' }}>
              <AthleteCard
                athlete={athlete}
                clubSettings={clubSettings}
                onFlip={handleFlip}
                isFlipped={isFlipped}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">No se encontró la información del atleta</p>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Haz clic en el ícono de voltear para ver el reverso del carnet
        </div>
      </DialogContent>
    </Dialog>
  );
};
