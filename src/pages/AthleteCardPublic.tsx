import { useParams } from 'react-router-dom';
import { useAthleteDetails } from '@/hooks/useAthleteDetails';
import { useClubSettings } from '@/hooks/useClubSettings';
import { AthleteCard } from '@/components/athletes/AthleteCard';
import { useState } from 'react';

export const AthleteCardPublic = () => {
  const { athleteId } = useParams();
  const { data: athlete, isLoading: athleteLoading } = useAthleteDetails(athleteId || null);
  const { data: clubSettings, isLoading: clubLoading } = useClubSettings();
  const [isFlipped, setIsFlipped] = useState(false);
  
  const isLoading = athleteLoading || clubLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando carnet...</p>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">No se encontró el carnet del atleta</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl" style={{ aspectRatio: '85.6 / 53.98' }}>
        <AthleteCard
          athlete={athlete}
          clubSettings={clubSettings}
          onFlip={() => setIsFlipped(!isFlipped)}
          isFlipped={isFlipped}
          qrCodeUrl={`${window.location.origin}/athlete-card/${athleteId}`}
        />
      </div>
    </div>
  );
};
