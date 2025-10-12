import { useState } from 'react';
import { Phone, Mail, Heart, IdCard, Trophy, FlipHorizontal, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AthleteDetails } from '@/hooks/useAthleteDetails';
import { ClubSettings } from '@/hooks/useClubSettings';

interface AthleteCardProps {
  athlete: AthleteDetails;
  clubSettings: ClubSettings | null;
  onFlip?: () => void;
  isFlipped?: boolean;
}

export const AthleteCard = ({ athlete, clubSettings, onFlip, isFlipped }: AthleteCardProps) => {
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      escuela: 'Escuela',
      menores: 'Menores',
      transicion: 'Transición',
      prejuvenil: 'Pre-Juvenil',
      juvenil: 'Juvenil',
      mayores: 'Mayores',
    };
    return labels[category] || category;
  };

  return (
    <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
      <div
        className={`relative w-full h-full transition-all duration-700 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary via-primary/90 to-primary-dark rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-sm px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {clubSettings?.club_logo_url ? (
                    <img
                      src={clubSettings.club_logo_url}
                      alt={clubSettings.club_name}
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">
                      {clubSettings?.club_name || 'Club'}
                    </h3>
                    <p className="text-white/80 text-xs">Carnet de Atleta</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onFlip}
                  className="text-white hover:bg-white/20"
                >
                  <FlipHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-4">
              {/* Athlete Photo and Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={athlete.avatar_url} alt={`${athlete.first_name} ${athlete.last_name}`} />
                  <AvatarFallback className="bg-white text-primary text-2xl font-bold">
                    {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-white">
                  <h2 className="text-2xl font-bold leading-tight mb-1">
                    {athlete.first_name} {athlete.last_name}
                  </h2>
                  <div className="space-y-1 text-sm">
                    <p className="text-white/90">
                      <span className="font-semibold">Categoría:</span> {getCategoryLabel(athlete.category)}
                    </p>
                    <p className="text-white/90">
                      <span className="font-semibold">Edad:</span> {calculateAge(athlete.date_of_birth)} años
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact & Medical Info */}
              <div className="grid grid-cols-1 gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                {athlete.phone && (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Phone className="h-4 w-4 text-white/80" />
                    <span>{athlete.phone}</span>
                  </div>
                )}
                {athlete.email && (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Mail className="h-4 w-4 text-white/80" />
                    <span className="truncate">{athlete.email}</span>
                  </div>
                )}
                {athlete.body_info?.blood_type && (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Heart className="h-4 w-4 text-white/80" />
                    <span>Tipo de Sangre: {athlete.body_info.blood_type}</span>
                  </div>
                )}
                {athlete.id_number && (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <IdCard className="h-4 w-4 text-white/80" />
                    <span>ID: {athlete.id_number}</span>
                  </div>
                )}
                {athlete.history?.is_league && (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Trophy className="h-4 w-4 text-white/80" />
                    <span>Liga: {clubSettings?.league || 'Sí'}</span>
                  </div>
                )}
              </div>

              {/* Athlete Number */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                <p className="text-white text-center font-mono font-bold text-lg">
                  {athlete.athlete_number || `ATH-${athlete.id.slice(0, 8).toUpperCase()}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 backface-hidden rotate-y-180"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-sm px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Carnet de Atleta</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onFlip}
                  className="text-white hover:bg-white/20"
                >
                  <FlipHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-white">
              {/* Club Information */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white/90 uppercase tracking-wide mb-2">
                  Información del Club
                </h4>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-1.5 text-sm border border-white/20">
                  {clubSettings?.club_name && (
                    <p><span className="font-semibold">Nombre:</span> {clubSettings.club_name}</p>
                  )}
                  {clubSettings?.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-white/80" />
                      <span>{clubSettings.address}</span>
                    </div>
                  )}
                  {clubSettings?.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-white/80" />
                      <span>{clubSettings.contact_phone}</span>
                    </div>
                  )}
                  {clubSettings?.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-white/80" />
                      <span className="truncate">{clubSettings.contact_email}</span>
                    </div>
                  )}
                  {clubSettings?.website_url && (
                    <p className="truncate">{clubSettings.website_url}</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {(athlete.emergency_contact_name || athlete.emergency_contact_phone) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white/90 uppercase tracking-wide">
                    Contacto de Emergencia
                  </h4>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-1.5 text-sm border border-white/20">
                    {athlete.emergency_contact_name && (
                      <p><span className="font-semibold">Nombre:</span> {athlete.emergency_contact_name}</p>
                    )}
                    {athlete.emergency_contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-white/80" />
                        <span>{athlete.emergency_contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Athlete Number & Validity */}
              <div className="space-y-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                  <p className="text-xs text-white/80 mb-1">Número de Atleta</p>
                  <p className="text-white font-mono font-bold text-center text-lg">
                    {athlete.athlete_number || `ATH-${athlete.id.slice(0, 8).toUpperCase()}`}
                  </p>
                </div>
                <div className="text-center text-xs text-white/70">
                  <p>Válido desde: {new Date(athlete.join_date).getFullYear()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};
