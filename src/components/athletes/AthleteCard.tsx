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

  const getIdDisplay = () => {
    if (!athlete.id_number) return 'Sin registrar';
    const idType = athlete.id_type?.toUpperCase() || 'ID';
    return `${idType} ${athlete.id_number}`;
  };

  const getBloodTypeDisplay = () => {
    return athlete.body_info?.blood_type || 'N/A';
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
          <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden p-6">
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

            <div className="relative z-10 h-full flex flex-col">
              {/* Club Logo - Top Left */}
              <div className="flex items-start gap-3 mb-3">
                {clubSettings?.club_logo_url && (
                  <div className="w-12 h-12 flex-shrink-0">
                    <img
                      src={clubSettings.club_logo_url}
                      alt="Club Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xs md:text-sm font-bold text-amber-600 uppercase tracking-wider leading-tight">
                    Patinador de Velocidad<br />en Línea
                  </h2>
                </div>
              </div>

              {/* Athlete Photo - Centered */}
              <div className="flex justify-center mb-3">
                <div className="w-28 md:w-32 aspect-[3/4] rounded-lg overflow-hidden shadow-lg border-2 border-blue-200">
                  {athlete.avatar_url ? (
                    <img
                      src={athlete.avatar_url}
                      alt={`${athlete.first_name} ${athlete.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-3xl font-bold text-blue-600">
                        {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Athlete Full Name */}
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 text-center mb-4 leading-tight px-2">
                {athlete.first_name} {athlete.last_name}
              </h1>

              {/* Info Grid - 2 columns x 3 rows */}
              <div className="grid grid-cols-2 gap-3 text-xs md:text-sm px-2">
                {/* Row 1 */}
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600 uppercase text-[10px] md:text-xs">RH</p>
                  <p className="text-slate-800 font-medium">{getBloodTypeDisplay()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600 uppercase text-[10px] md:text-xs">ID</p>
                  <p className="text-slate-800 font-medium">{getIdDisplay()}</p>
                </div>

                {/* Row 2 */}
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600 uppercase text-[10px] md:text-xs">Liga</p>
                  <p className="text-slate-800 font-medium">{clubSettings?.league || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600 uppercase text-[10px] md:text-xs">Club</p>
                  <p className="text-slate-800 font-medium truncate">{clubSettings?.club_name || 'N/A'}</p>
                </div>

                {/* Row 3 */}
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600 uppercase text-[10px] md:text-xs">Carnet</p>
                  <p className="text-slate-800 font-medium">{athlete.athlete_number || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600 uppercase text-[10px] md:text-xs">Válido</p>
                  <p className="text-slate-800 font-medium">{getValidityYear()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="relative w-full h-full bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
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

            <div className="relative z-10 h-full flex flex-col items-center justify-between py-4">
              {/* Club Logo - Large and Centered */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                {clubSettings?.club_logo_url && (
                  <div className="w-32 h-32 md:w-40 md:h-40">
                    <img
                      src={clubSettings.club_logo_url}
                      alt="Club Logo"
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                )}

                {/* Decorative Line */}
                <div className="w-48 h-px bg-white/30" />

                {/* Certification Message */}
                <div className="text-center space-y-2 px-6">
                  <p className="text-base md:text-lg font-medium leading-relaxed">
                    Este documento certifica que<br />eres miembro activo del club
                  </p>
                </div>

                {/* Club Name - Large */}
                <h2 className="text-2xl md:text-3xl font-bold text-white text-center px-4">
                  {clubSettings?.club_name || 'Club de Patinaje'}
                </h2>
              </div>

              {/* QR Code - Small at Bottom */}
              <div className="flex flex-col items-center space-y-2">
                {qrCodeUrl ? (
                  <div className="bg-white rounded-lg p-2 shadow-lg">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-16 h-16 md:w-20 md:h-20"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-2 shadow-lg w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    <span className="text-slate-400 text-[8px] text-center">QR</span>
                  </div>
                )}
                {clubSettings?.website_url && (
                  <p className="text-[10px] text-white/70">
                    {clubSettings.website_url}
                  </p>
                )}
              </div>
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
