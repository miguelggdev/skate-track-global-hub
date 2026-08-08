import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AddCompetitionDialog } from '@/components/competitions/AddCompetitionDialog';
import CompetitionStatsCards from '@/components/competitions/CompetitionStatsCards';
import CompetitionResults from '@/components/competitions/CompetitionResults';
import CompetitionsTable from '@/components/competitions/CompetitionsTable';
import UpcomingEvents from '@/components/competitions/UpcomingEvents';
import { MedalsAnalytics } from '@/components/competitions/MedalsAnalytics';
import { MedalPodium } from '@/components/competitions/MedalPodium';
import { SkatingEventsList } from '@/components/competitions/SkatingEventsList';
import { VirtualPodiumByCategory } from '@/components/competitions/VirtualPodiumByCategory';
import { ResultsImportModal } from '@/components/competitions/ResultsImportModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCompetitions, type Competition } from '@/hooks/useCompetitions';
import { Trophy } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';

const Competitions = () => {
  const { t } = useTranslation();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const { data: competitions = [] } = useCompetitions();

  const selectedCompetition = competitions.find((c: Competition) => c.id === selectedCompetitionId);

  return (
    <DashboardLayout title={t('page.competitions.title')}>
      <div className="space-y-6 max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('page.competitions.title')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gestiona competencias, eventos, resultados y podio virtual
            </p>
          </div>
          <AddCompetitionDialog />
        </div>

        {/* Stats Cards */}
        <CompetitionStatsCards />

        {/* Tabs */}
        <Tabs defaultValue="competitions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="competitions">Competencias</TabsTrigger>
            <TabsTrigger value="medals">Medallas</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="podio" className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              Podio Virtual
            </TabsTrigger>
          </TabsList>

          {/* Tab: Lista de competencias */}
          <TabsContent value="competitions" className="space-y-6">
            <CompetitionsTable />
            <SkatingEventsList />
            <MedalPodium />
            <UpcomingEvents />
          </TabsContent>

          {/* Tab: Análisis de medallas */}
          <TabsContent value="medals">
            <MedalsAnalytics />
          </TabsContent>

          {/* Tab: Resultados + importación */}
          <TabsContent value="results" className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Select
                  value={selectedCompetitionId}
                  onValueChange={setSelectedCompetitionId}
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Seleccionar competencia…" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map((c: Competition) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCompetitionId && selectedCompetition && (
                <ResultsImportModal
                  competitionId={selectedCompetitionId}
                  competitionName={selectedCompetition.name}
                  onImported={() => {}}
                />
              )}
            </div>
            <CompetitionResults />
          </TabsContent>

          {/* Tab: Podio virtual por categoría */}
          <TabsContent value="podio" className="space-y-4">
            <div className="flex items-center gap-3">
              <Select
                value={selectedCompetitionId}
                onValueChange={setSelectedCompetitionId}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Seleccionar competencia para el podio…" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((c: Competition) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompetitionId && selectedCompetition ? (
              <VirtualPodiumByCategory
                competitionId={selectedCompetitionId}
                competitionName={selectedCompetition.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Trophy className="h-14 w-14 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">
                  Selecciona una competencia para ver el podio virtual
                </p>
                <p className="text-xs text-muted-foreground">
                  Las medallas son asignadas manualmente por el admin o delegado
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Competitions;
