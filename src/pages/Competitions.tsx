
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AddCompetitionDialog } from '@/components/competitions/AddCompetitionDialog';
import CompetitionStatsCards from '@/components/competitions/CompetitionStatsCards';
import CompetitionResults from '@/components/competitions/CompetitionResults';
import CompetitionsTable from '@/components/competitions/CompetitionsTable';
import UpcomingEvents from '@/components/competitions/UpcomingEvents';

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

        {/* Main Dashboard Content */}
        <CompetitionResults />

        {/* Competition Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Competitions Table */}
          <CompetitionsTable />

          {/* Upcoming Events */}
          <UpcomingEvents />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Competitions;
