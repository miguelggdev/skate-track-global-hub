import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Timer, TrendingUp, Trophy, UserRound } from 'lucide-react';
import { TimeRecordForm } from '@/components/times/TimeRecordForm';
import { TimeHistoryChart } from '@/components/times/TimeHistoryChart';
import { ClubRanking } from '@/components/times/ClubRanking';
import { supabase } from '@/integrations/supabase/client';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  category: string | null;
}

const Tiempos = () => {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['athletes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category')
        .eq('status', 'active')
        .order('last_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  return (
    <DashboardLayout title="Tiempos y Pruebas">
      <div className="space-y-6 max-w-none">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tiempos Cronometrados</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Registra tiempos, visualiza la evolución y consulta el ranking del club
          </p>
        </div>

        <Tabs defaultValue="registrar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="registrar" className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Registrar
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Ranking Club
            </TabsTrigger>
          </TabsList>

          {/* Tab: Registrar */}
          <TabsContent value="registrar">
            <TimeRecordForm />
          </TabsContent>

          {/* Tab: Historial por atleta */}
          <TabsContent value="historial" className="space-y-4">
            {/* Selector atleta */}
            <div className="flex items-center gap-3">
              <UserRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Seleccionar atleta…" />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.last_name}, {a.first_name}
                      {a.category && (
                        <span className="text-muted-foreground ml-1">({a.category})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAthleteId && selectedAthlete ? (
              <TimeHistoryChart
                athleteId={selectedAthleteId}
                athleteName={`${selectedAthlete.first_name} ${selectedAthlete.last_name}`}
              />
            ) : (
              <Card className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <TrendingUp className="h-14 w-14 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">
                  Selecciona un atleta para ver su historial
                </p>
                <p className="text-xs text-muted-foreground">
                  Verás la evolución de tiempos y gráfica de progreso
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Ranking del club */}
          <TabsContent value="ranking">
            <ClubRanking />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Tiempos;
