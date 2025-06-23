
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCards from '@/components/athletes/StatsCards';
import SearchFilterBar from '@/components/athletes/SearchFilterBar';
import AthletesTable from '@/components/athletes/AthletesTable';
import RecentActivity from '@/components/athletes/RecentActivity';
import AthletesHeader from '@/components/athletes/AthletesHeader';

const Athletes = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const athletes = [
    {
      id: 1,
      name: "Juan Pérez",
      email: "juan.perez@email.com",
      category: "Junior",
      level: "Advanced",
      joinDate: "2024-01-15",
      status: "Active",
      performance: 92,
      avatar: "🥇"
    },
    {
      id: 2,
      name: "María García",
      email: "maria.garcia@email.com",
      category: "Senior",
      level: "Professional",
      joinDate: "2023-08-20",
      status: "Active",
      performance: 95,
      avatar: "🏆"
    },
    {
      id: 3,
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@email.com",
      category: "Youth",
      level: "Intermediate",
      joinDate: "2024-03-10",
      status: "Training",
      performance: 78,
      avatar: "🥈"
    },
    {
      id: 4,
      name: "Ana López",
      email: "ana.lopez@email.com",
      category: "Junior",
      level: "Advanced",
      joinDate: "2024-02-05",
      status: "Active",
      performance: 88,
      avatar: "🥉"
    },
    {
      id: 5,
      name: "Diego Martín",
      email: "diego.martin@email.com",
      category: "Senior",
      level: "Professional",
      joinDate: "2023-11-12",
      status: "Injured",
      performance: 85,
      avatar: "🏅"
    }
  ];

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Athletes Management">
      <div className="space-y-6 w-full">
        <AthletesHeader />
        <StatsCards />
        <SearchFilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
          <AthletesTable athletes={filteredAthletes} />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Athletes;
