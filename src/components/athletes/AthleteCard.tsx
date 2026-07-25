import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AthleteDetails } from '@/hooks/useAthleteDetails';
import { ClubSettings } from '@/hooks/useClubSettings';
import { SkatingHelmetIcon } from './SkatingHelmetIcon';

interface AthleteCardProps {
  athlete: AthleteDetails;
  clubSettings: ClubSettings | null;
  onFlip?: () => void;
  isFlipped?: boolean;
}

export const AthleteCard = ({ 
  athlete, 
  clubSettings, 
  onFlip, 
  isFlipped = false
}: AthleteCardProps) => {
  const getIdDisplay = () => {
    if (!athlete.id_number) return 'Sin registrar';
    const idType = athlete.id_type?.toUpperCase() || 'ID';
    return `${idType} ${athlete.id_number}`;
  };

  const getBloodTypeDisplay = () => {
    return athlete.body_info?.blood_type || 'N/A';
  };

  return (
    <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
      <Button
        onClick={onFlip}
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white shadow-lg"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT SIDE */}
        <div
          className="absolute w-full h-full rounded-xl overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Blue Header Section */}
          <div className="relative h-[30%] flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#0047BB' }}>
            {/* Speed lines left */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </div>

            {/* Title */}
            <div className="text-center z-10">
              <div className="text-white font-bold text-xl tracking-wide">
                DEPORTISTA PATINAJE
              </div>
              <div className="font-bold text-lg tracking-wide" style={{ color: '#E31E24' }}>
                DE VELOCIDAD EN LÍNEA
              </div>
            </div>

            {/* Speed lines right */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </div>
          </div>

          {/* White Body Section */}
          <div className="relative h-[60%] bg-white p-6">
            <div className="flex gap-6 h-full">
              {/* Left: Photo */}
              <div className="flex-shrink-0">
                <div
                  className="w-32 h-32 rounded-lg overflow-hidden"
                  style={{ border: '4px solid #E31E24', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                >
                  {athlete.avatar_url ? (
                    <img
                      src={athlete.avatar_url}
                      alt={`${athlete.first_name} ${athlete.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold" style={{ backgroundColor: '#0047BB', color: 'white' }}>
                      {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Center/Right: Information */}
              <div className="flex-1 flex flex-col justify-between">
                {/* Name */}
                <div className="text-center mb-3">
                  <h2 className="font-bold text-2xl uppercase tracking-wide" style={{ color: '#001F54' }}>
                    {athlete.first_name} {athlete.last_name}
                  </h2>
                </div>

                {/* Information Fields */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>RH blood type</span>
                    <div className="flex-1 border-b border-gray-300 pb-1">
                      <span className="text-sm font-semibold" style={{ color: '#001F54' }}>
                        {getBloodTypeDisplay()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Documento de Identidad (ID)</span>
                    <div className="flex-1 border-b border-gray-300 pb-1">
                      <span className="text-sm font-semibold" style={{ color: '#001F54' }}>
                        {getIdDisplay()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Liga (League)</span>
                    <div className="flex-1 border-b border-gray-300 pb-1">
                      <span className="text-sm font-semibold" style={{ color: '#001F54' }}>
                        {clubSettings?.league || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Club</span>
                    <div className="flex-1 border-b border-gray-300 pb-1">
                      <span className="text-sm font-semibold" style={{ color: '#001F54' }}>
                        {clubSettings?.club_name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Helmet Icon */}
              <div className="flex-shrink-0 flex items-start pt-4">
                <SkatingHelmetIcon className="w-16 h-16 opacity-80" />
              </div>
            </div>
          </div>

          {/* Red Footer Section */}
          <div className="h-[10%] flex items-center justify-center" style={{ backgroundColor: '#E31E24' }}>
            <div className="text-white font-bold text-base tracking-wide">
              Numero ID del Deportista: {athlete.athlete_number || 'N/A'}
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute w-full h-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative w-full h-full p-8 flex flex-col items-center justify-center">
            {/* Background decorative shapes */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>

            {/* Club Logo */}
            <div className="relative z-10 mb-6">
              {clubSettings?.club_logo_url ? (
                <img
                  src={clubSettings.club_logo_url}
                  alt="Club Logo"
                  className="w-32 h-32 object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {clubSettings?.club_name?.[0] || 'C'}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-48 h-px bg-white/30 mb-6"></div>

            {/* Certification Message */}
            <div className="relative z-10 text-center mb-6 max-w-md">
              <p className="text-white text-base leading-relaxed font-medium">
                Este documento certifica que eres miembro activo del club
              </p>
            </div>

            {/* Club Name */}
            <div className="relative z-10 text-center">
              <h3 className="text-white text-2xl font-bold tracking-wide">
                {clubSettings?.club_name || 'Club Name'}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
