import { FlipHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AthleteDetails } from '@/hooks/useAthleteDetails';
import { ClubSettings } from '@/hooks/useClubSettings';
import { FrontBlobs, BackBlobs } from './DecorativeBlobs';

interface AthleteCardProps {
  athlete: AthleteDetails;
  clubSettings: ClubSettings | null;
  onFlip?: () => void;
  isFlipped?: boolean;
  qrCodeUrl?: string;
}

export const AthleteCard = ({ 
  athlete, 
  clubSettings, 
  onFlip, 
  isFlipped = false,
  qrCodeUrl 
}: AthleteCardProps) => {
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      escuela: 'Escuela',
      menores: 'Menores',
      transicion: 'Transición',
      prejuvenil: 'Pre-juvenil',
      juvenil: 'Juvenil',
      mayores: 'Mayores'
    };
    return labels[category] || category;
  };

  const getValidityYear = () => {
    if (athlete.join_date) {
      return new Date(athlete.join_date).getFullYear();
    }
    return new Date().getFullYear();
  };

  return (
    <div className="relative w-full h-full perspective-1000">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT SIDE */}
        <div className="absolute inset-0 backface-hidden">
          <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col items-center justify-between">
            <FrontBlobs />
            
            {/* Flip button */}
            {onFlip && (
              <Button
                onClick={onFlip}
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 z-10 hover:bg-blue-100"
              >
                <FlipHorizontal className="h-5 w-5 text-blue-600" />
              </Button>
            )}

            {/* Club Logo */}
            {clubSettings?.club_logo_url && (
              <div className="w-16 h-16 mb-4">
                <img
                  src={clubSettings.club_logo_url}
                  alt="Club Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Athlete Photo */}
            <div className="w-full max-w-[180px] aspect-[3/4] rounded-xl overflow-hidden shadow-lg border-4 border-gray-100 mb-4">
              {athlete.avatar_url ? (
                <img
                  src={athlete.avatar_url}
                  alt={`${athlete.first_name} ${athlete.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-5xl font-bold text-blue-600">
                    {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Athlete Information */}
            <div className="space-y-2 text-center flex-1 flex flex-col justify-center">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                {athlete.first_name} {athlete.last_name}
              </h1>
              
              <p className="text-sm md:text-base text-slate-600">
                Categoría: {getCategoryLabel(athlete.category)}
              </p>

              <div className="pt-3 space-y-1">
                <p className="text-xs md:text-sm text-slate-700">
                  <span className="font-semibold">Tarjeta de identidad:</span> {athlete.athlete_number || athlete.id?.slice(0, 8) || 'N/A'}
                </p>
                
                {athlete.phone && (
                  <p className="text-xs md:text-sm text-slate-700">
                    <span className="font-semibold">Teléfono:</span> {athlete.phone}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-600 pt-2">
                Válido {athlete.first_name?.toLowerCase()}: {getValidityYear()}
              </p>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="relative w-full h-full bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col items-center justify-between text-white">
            <BackBlobs />
            
            {/* Flip button */}
            {onFlip && (
              <Button
                onClick={onFlip}
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 z-10 hover:bg-white/20 text-white"
              >
                <FlipHorizontal className="h-5 w-5" />
              </Button>
            )}

            {/* QR Code Section */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              {qrCodeUrl ? (
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-40 h-40 md:w-48 md:h-48"
                  />
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 shadow-xl w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
                  <span className="text-slate-400 text-xs text-center">QR Code</span>
                </div>
              )}

              {clubSettings?.website_url && (
                <p className="text-sm font-medium text-white/90">
                  {clubSettings.website_url}
                </p>
              )}

              {/* Decorative Dots */}
              <div className="flex gap-1.5 py-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-white/60" />
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-center text-white/80 max-w-md leading-relaxed px-4">
                Este carné es personal e intransferible y todas las acciones realizadas con el carné se entiende su titular.
              </p>
            </div>

            {/* Club Name at Bottom */}
            <div className="text-center">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {clubSettings?.club_name || 'Club de Patinaje'}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};
