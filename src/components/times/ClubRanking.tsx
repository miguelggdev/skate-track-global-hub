import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Medal, Loader2, Trophy } from 'lucide-react';
import { formatTimeMs } from '@/lib/time-formatter';
import { useRaceEvents, useClubRanking, type ClubRankingRow } from '@/hooks/useTimeRecords';

const GENDER_LABELS: Record<string, string> = {
  masculino: 'Varones',
  femenino: 'Damas',
};

const POSITION_STYLES: Record<number, string> = {
  1: 'bg-yellow-400/20 text-yellow-700 border-yellow-400/40',
  2: 'bg-slate-200/60 text-slate-600 border-slate-300',
  3: 'bg-amber-600/15 text-amber-700 border-amber-600/30',
};

function PositionBadge({ pos }: { pos: number }) {
  if (pos <= 3) {
    const labels = ['', '🥇', '🥈', '🥉'];
    return (
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold ${POSITION_STYLES[pos]}`}>
        {labels[pos]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
      {pos}
    </span>
  );
}

export function ClubRanking() {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data: raceEvents = [] } = useRaceEvents();
  const { data: ranking = [], isLoading } = useClubRanking(selectedEvent);

  const filtered = ranking
    .filter(r => filterGender === 'all' || r.gender === filterGender)
    .filter(r => filterCategory === 'all' || r.category === filterCategory);

  const categories = [...new Set(ranking.map(r => r.category).filter(Boolean) as string[])].sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="h-4 w-4 text-primary" />
          Ranking Interno del Club
        </CardTitle>
        <CardDescription>
          Mejores tiempos por prueba — un tiempo por atleta (récord personal)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar prueba…" />
            </SelectTrigger>
            <SelectContent>
              {raceEvents.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Rama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="masculino">Varones</SelectItem>
              <SelectItem value="femenino">Damas</SelectItem>
            </SelectContent>
          </Select>

          {categories.length > 0 && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Contenido */}
        {!selectedEvent ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
            <Medal className="h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">Selecciona una prueba</p>
            <p className="text-sm">para ver el ranking del club</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando ranking…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium">Sin tiempos registrados para esta prueba</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="px-3 py-2 text-left w-12">Pos</th>
                  <th className="px-3 py-2 text-left">Atleta</th>
                  <th className="px-3 py-2 text-left">Categoría</th>
                  <th className="px-3 py-2 text-left">Rama</th>
                  <th className="px-3 py-2 text-right">Tiempo</th>
                  <th className="px-3 py-2 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row, idx) => (
                  <tr
                    key={row.athlete_id}
                    className={`hover:bg-muted/30 transition-colors ${idx === 0 ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : ''}`}
                  >
                    <td className="px-3 py-2.5">
                      <PositionBadge pos={idx + 1} />
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {row.last_name}, {row.first_name}
                      {row.is_club_record && (
                        <Badge variant="default" className="ml-2 text-[10px] h-4 px-1.5">CR</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {row.category ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {row.gender ? GENDER_LABELS[row.gender] ?? row.gender : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">
                      {formatTimeMs(row.best_time_ms)}s
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground text-xs">
                      {new Date(row.recorded_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
              {filtered.length} atletas · CR = Récord del club
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
