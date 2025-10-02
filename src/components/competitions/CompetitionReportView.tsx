import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Mail, Trophy, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Athlete {
  first_name: string;
  last_name: string;
  age: number;
  category: string;
  level: string;
}

interface CompetitionReportData {
  competition: {
    name: string;
    start_date: string;
    location?: string;
    league?: string;
  };
  clubInfo: {
    club_name?: string;
    logo_url?: string;
    email?: string;
    address?: string;
  };
  damas: Athlete[];
  varones: Athlete[];
}

interface CompetitionReportViewProps {
  data: CompetitionReportData;
}

export const CompetitionReportView: React.FC<CompetitionReportViewProps> = ({ data }) => {
  const { competition, clubInfo, damas, varones } = data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderAthleteTable = (athletes: Athlete[], title: string) => {
    if (athletes.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {athletes.length} {athletes.length === 1 ? 'atleta' : 'atletas'}
          </Badge>
        </div>
        
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16 font-semibold">#</TableHead>
                <TableHead className="font-semibold">Nombre Completo</TableHead>
                <TableHead className="w-24 font-semibold">Edad</TableHead>
                <TableHead className="font-semibold">Categoría</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes.map((athlete, index) => (
                <TableRow 
                  key={index}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {athlete.first_name} {athlete.last_name}
                  </TableCell>
                  <TableCell className="text-center">
                    {athlete.age} años
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {athlete.category}/{athlete.level}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto bg-background p-8 space-y-8 print:p-6">
      {/* Header Section */}
      <div className="space-y-6 pb-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            {clubInfo.logo_url && (
              <img
                src={clubInfo.logo_url}
                alt="Club Logo"
                className="h-16 object-contain"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                REPORTE DE COMPETICIÓN
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                {clubInfo.club_name || 'Mi Club de Patinaje'}
              </p>
            </div>
          </div>
          <Badge variant="destructive" className="text-sm px-4 py-2">
            Confidencial
          </Badge>
        </div>
      </div>

      {/* Competition Information Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-primary" />
            {competition.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                <p className="text-base font-semibold text-foreground">
                  {formatDate(competition.start_date)}
                </p>
              </div>
            </div>

            {competition.location && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                  <p className="text-base font-semibold text-foreground">
                    {competition.location}
                  </p>
                </div>
              </div>
            )}

            {competition.league && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Trophy className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Liga</p>
                  <p className="text-base font-semibold text-foreground">
                    {competition.league}
                  </p>
                </div>
              </div>
            )}

            {clubInfo.email && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contacto</p>
                  <p className="text-base font-semibold text-foreground">
                    {clubInfo.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Athletes Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Atletas Registrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {renderAthleteTable(damas, 'DAMAS')}
          {renderAthleteTable(varones, 'VARONES')}
          
          {damas.length === 0 && varones.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay atletas registrados para esta competición.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      {clubInfo.address && (
        <div className="pt-6 border-t border-border text-sm text-muted-foreground text-center">
          <p>{clubInfo.address}</p>
        </div>
      )}
    </div>
  );
};
