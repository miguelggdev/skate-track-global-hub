
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCards from '@/components/athletes/StatsCards';

import AthletesTable from '@/components/athletes/AthletesTable';
import RecentActivity from '@/components/athletes/RecentActivity';
import UpcomingBirthdays from '@/components/athletes/UpcomingBirthdays';
import AthletesHeader from '@/components/athletes/AthletesHeader';
import { Athlete } from '@/hooks/useAthletes';

// Extended athlete interface with profile data
interface AthleteWithProfile extends Athlete {
  athlete_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  achievements?: string;
  // Profile data
  avatar_url?: string;
  id_type?: string;
  id_number?: string;
  date_of_birth?: string;
  phone?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
}

const ITEMS_PER_PAGE = 25;

const Athletes = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['athletes', currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data, error, count } = await supabase
        .from('athletes')
        .select(`
          *,
          profiles(avatar_url, date_of_birth, phone)
        `, { count: 'exact' })
        .range(offset, offset + ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalCount = count ?? 0;
      const athletes: AthleteWithProfile[] = (data ?? []).map(a => ({
        ...a,
        avatar_url:    a.profiles?.avatar_url ?? a.photo_url,
        id_type:       (a as any).identification_type,
        id_number:     (a as any).identification_number,
        date_of_birth: a.profiles?.date_of_birth ?? a.date_of_birth,
        phone:         a.profiles?.phone ?? a.personal_phone,
      }));

      return {
        athletes,
        totalCount,
        totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
      };
    },
  });

  const athletes = data?.athletes ?? [];
  const pagination: PaginationData = {
    currentPage,
    totalPages:  data?.totalPages  ?? 0,
    totalCount:  data?.totalCount  ?? 0,
    itemsPerPage: ITEMS_PER_PAGE,
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) setCurrentPage(page);
  };

  const handleAthleteAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['athletes'] });
  };

  return (
    <DashboardLayout title="Athletes Management">
      <div className="space-y-6 max-w-none">
        <AthletesHeader onAthleteAdded={handleAthleteAdded} />
        <StatsCards />
        
        
        {/* Main Content Grid */}
        <div className="space-y-6">
          <AthletesTable
            athletes={athletes}
            loading={isLoading}
            onActionCompleted={() => queryClient.invalidateQueries({ queryKey: ['athletes'] })}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
          
          {/* Side modules in a single row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <UpcomingBirthdays />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Athletes;
