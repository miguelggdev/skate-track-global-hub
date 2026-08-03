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

interface MedalResult {
  id: string;
  medal_type: 'gold' | 'silver' | 'bronze';
  time_seconds?: number | null;
  position?: number;
  event_name?: string;
  notes?: string;
  athletes: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface EventResult {
  id: string;
  medal_type?: 'gold' | 'silver' | 'bronze';
  time_seconds?: number | null;
  position?: number;
  event_name?: string;
  notes?: string;
  athletes: {
    id: string;
    first_name: string;
    last_name: string;
  };
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
  medalResults?: MedalResult[];
  allResults?: EventResult[];
  medalStats?: {
    gold: number;
    silver: number;
    bronze: number;
    totalMedals: number;
  };
}

interface CompetitionReportViewProps {
  data: CompetitionReportData;
}

export const CompetitionReportView: React.FC<CompetitionReportViewProps> = ({ data }) => {
  const { competition, clubInfo, damas, varones, medalResults = [], allResults = [], medalStats } = data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (seconds?: number | null) => {
    if (seconds == null) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return mins > 0 ? `${mins}:${secs}` : `${secs}s`;
  };

  const getMedalColor = (type: string) => {
    switch (type) {
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getMedalLabel = (type: string) => {
    switch (type) {
      case 'gold': return 'Oro';
      case 'silver': return 'Plata';
      case 'bronze': return 'Bronce';
      default: return type;
    }
  };

  const groupResultsByEvent = () => {
    const grouped: Record<string, EventResult[]> = {};
    allResults.forEach(result => {
      const key = result.event_name || 'Sin evento';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(result);
    });
    return grouped;
  };

  const resultsByEvent = groupResultsByEvent();

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
                  key={`${athlete.first_name}-${athlete.last_name}-${index}`}
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

      {/* Medal Results Section */}
      {medalStats && medalStats.totalMedals > 0 && (
        <>
          {/* Medal Statistics Overview */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-5 w-5 text-primary" />
                Resumen de Medallas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-700">{medalStats.gold}</div>
                  <div className="text-sm font-medium text-yellow-600 mt-1">Oro</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-gray-700">{medalStats.silver}</div>
                  <div className="text-sm font-medium text-gray-600 mt-1">Plata</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-700">{medalStats.bronze}</div>
                  <div className="text-sm font-medium text-orange-600 mt-1">Bronce</div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{medalStats.totalMedals}</div>
                  <div className="text-sm font-medium text-primary mt-1">Total</div>
                </div>
              </div>

              {/* Medal Distribution Chart */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Distribución de Medallas</h4>
                {medalStats.gold > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Oro</span>
                      <span className="font-medium">{medalStats.gold}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500"
                        style={{ width: `${(medalStats.gold / medalStats.totalMedals) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {medalStats.silver > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plata</span>
                      <span className="font-medium">{medalStats.silver}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-400"
                        style={{ width: `${(medalStats.silver / medalStats.totalMedals) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {medalStats.bronze > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bronce</span>
                      <span className="font-medium">{medalStats.bronze}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-600"
                        style={{ width: `${(medalStats.bronze / medalStats.totalMedals) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Medal Results Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Resultados de Medallas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Atleta</TableHead>
                      <TableHead className="font-semibold">Evento</TableHead>
                      <TableHead className="font-semibold">Medalla</TableHead>
                      <TableHead className="font-semibold">Tiempo/Puntaje</TableHead>
                      <TableHead className="font-semibold text-center">Posición</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medalResults.map((result) => (
                      <TableRow key={result.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          {result.athletes.first_name} {result.athletes.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{result.event_name || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getMedalColor(result.medal_type)}>
                            {getMedalLabel(result.medal_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(result.time_seconds)}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {result.position || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Performance by Event Section */}
      {allResults.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Rendimiento por Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(resultsByEvent).map(([eventName, eventResults]) => (
              <div key={eventName} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <h3 className="font-semibold text-foreground">{eventName}</h3>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-16 font-semibold">Pos.</TableHead>
                        <TableHead className="font-semibold">Atleta</TableHead>
                        <TableHead className="font-semibold">Tiempo</TableHead>
                        <TableHead className="font-semibold">Medalla</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventResults.map((result, index) => (
                        <TableRow key={result.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-bold text-muted-foreground">
                            {result.position || index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {result.athletes.first_name} {result.athletes.last_name}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatTime(result.time_seconds)}
                          </TableCell>
                          <TableCell>
                            {result.medal_type ? (
                              <Badge variant="outline" className={getMedalColor(result.medal_type)}>
                                {getMedalLabel(result.medal_type)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      {clubInfo.address && (
        <div className="pt-6 border-t border-border text-sm text-muted-foreground text-center">
          <p>{clubInfo.address}</p>
        </div>
      )}
    </div>
  );
};
