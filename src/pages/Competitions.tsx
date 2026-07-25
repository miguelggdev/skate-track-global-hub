
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AddCompetitionDialog } from '@/components/competitions/AddCompetitionDialog';
import CompetitionStatsCards from '@/components/competitions/CompetitionStatsCards';
import CompetitionResults from '@/components/competitions/CompetitionResults';
import CompetitionsTable from '@/components/competitions/CompetitionsTable';
import UpcomingEvents from '@/components/competitions/UpcomingEvents';
import { MedalsAnalytics } from '@/components/competitions/MedalsAnalytics';
import { MedalPodium } from '@/components/competitions/MedalPodium';
import { SkatingEventsList } from '@/components/competitions/SkatingEventsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Competitions = () => {

  return (
    <DashboardLayout title="Competitions">
      <div className="space-y-6 max-w-none">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Competitions</h1>
              <p className="text-gray-600">Manage competitions, events and track results</p>
            </div>
            <AddCompetitionDialog />
          </div>
        </div>

        {/* Stats Cards */}
        <CompetitionStatsCards />

        {/* Tabs for different sections */}
        <Tabs defaultValue="competitions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="competitions">Competitions</TabsTrigger>
            <TabsTrigger value="medals">Medal Analytics</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="competitions" className="space-y-6">
            {/* Competition Management */}
            <CompetitionsTable />

            {/* Skating Events List */}
            <SkatingEventsList />

            {/* Medal Podium */}
            <MedalPodium />

            {/* Upcoming Events */}
            <UpcomingEvents />
          </TabsContent>

          <TabsContent value="medals">
            <MedalsAnalytics />
          </TabsContent>

          <TabsContent value="results">
            <CompetitionResults />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Competitions;
