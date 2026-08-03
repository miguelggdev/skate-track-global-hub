import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ClipboardList, Plus, Activity, History, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEvaluations } from '@/hooks/useEvaluations';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
import { EvaluationRadarChart } from '@/components/evaluations/EvaluationRadarChart';
import { EvaluationHistoryTable } from '@/components/evaluations/EvaluationHistoryTable';

const EvaluationsPage = () => {
  const [athleteId, setAthleteId] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-active-list'],
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

  const { data: evaluations = [], isLoading } = useEvaluations(athleteId || undefined);

  const selectedAthlete = athletes.find(a => a.id === athleteId);

  return (
    <DashboardLayout title="Evaluaciones">
      <div className="space-y-6 max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Evaluaciones de Deportistas</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Seguimiento de rendimiento: velocidad, técnica, fuerza y resistencia
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva evaluación
          </Button>
        </div>

        {/* Athlete selector */}
        <div className="flex items-center gap-3">
          <UserRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Select value={athleteId} onValueChange={setAthleteId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Seleccionar atleta para ver evaluaciones…" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.last_name}, {a.first_name}
                  <span className="text-muted-foreground ml-1 text-xs">({a.category})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {athleteId && (
            <span className="text-sm text-muted-foreground">
              {evaluations.length} evaluación{evaluations.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Content */}
        {!athleteId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <ClipboardList className="h-16 w-16 text-muted-foreground/25" />
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">Selecciona un atleta</p>
                <p className="text-sm text-muted-foreground/70">
                  Verás el radar de rendimiento y el historial completo de evaluaciones
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Crear primera evaluación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="radar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-xs">
              <TabsTrigger value="radar" className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Radar
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="radar">
              {isLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                  </CardContent>
                </Card>
              ) : (
                <EvaluationRadarChart evaluations={evaluations} />
              )}
            </TabsContent>

            <TabsContent value="historial">
              {isLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                  </CardContent>
                </Card>
              ) : (
                <EvaluationHistoryTable evaluations={evaluations} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <EvaluationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultAthleteId={athleteId || undefined}
      />
    </DashboardLayout>
  );
};

export default EvaluationsPage;
