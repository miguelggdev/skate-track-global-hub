
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCards from '@/components/athletes/StatsCards';

import AthletesTable from '@/components/athletes/AthletesTable';
import RecentActivity from '@/components/athletes/RecentActivity';
import UpcomingBirthdays from '@/components/athletes/UpcomingBirthdays';
import AthletesHeader from '@/components/athletes/AthletesHeader';
import { useToast } from '@/hooks/use-toast';
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

const Athletes = () => {
  
  const [athletes, setAthletes] = useState<AthleteWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    itemsPerPage: 25,
  });
  const { toast } = useToast();

  const fetchAthletes = async (page = 1) => {
    try {
      setLoading(true);
      
      // Calculate offset for pagination
      const offset = (page - 1) * pagination.itemsPerPage;
      
      // Build the query with pagination and search, joining with profiles table
      let query = supabase
        .from('athletes')
        .select(`
          *,
          profiles!inner(
            avatar_url,
            id_type,
            id_number,
            date_of_birth,
            phone
          )
        `, { count: 'exact' })
        .range(offset, offset + pagination.itemsPerPage - 1)
        .order('created_at', { ascending: false });
      

      const { data, error, count } = await query;

      if (error) throw error;
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pagination.itemsPerPage);
      
      // Flatten the profile data into the athlete object for easier access
      const flattenedAthletes = (data || []).map(athlete => ({
        ...athlete,
        avatar_url: athlete.profiles?.avatar_url,
        id_type: athlete.profiles?.id_type,
        id_number: athlete.profiles?.id_number,
        date_of_birth: athlete.profiles?.date_of_birth,
        phone: athlete.profiles?.phone,
      }));
      
      setAthletes(flattenedAthletes);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages,
        totalCount,
      }));
    } catch (error) {
      console.error('Error fetching athletes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los atletas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchAthletes(page);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  const handleAthleteAdded = () => {
    fetchAthletes(pagination.currentPage);
    toast({
      title: "Éxito",
      description: "Atleta creado exitosamente",
    });
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
            loading={loading} 
            onActionCompleted={() => fetchAthletes(pagination.currentPage)}
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
