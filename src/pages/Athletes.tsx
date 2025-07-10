
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCards from '@/components/athletes/StatsCards';
import SearchFilterBar from '@/components/athletes/SearchFilterBar';
import AthletesTable from '@/components/athletes/AthletesTable';
import RecentActivity from '@/components/athletes/RecentActivity';
import AthletesHeader from '@/components/athletes/AthletesHeader';
import { useToast } from '@/hooks/use-toast';

interface Athlete {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category: string;
  level: string;
  join_date: string;
  status: string;
  performance_score?: number;
}

const Athletes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAthletes(data || []);
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

  useEffect(() => {
    fetchAthletes();
  }, []);

  const handleAthleteAdded = () => {
    fetchAthletes();
    toast({
      title: "Éxito",
      description: "Atleta creado exitosamente",
    });
  };

  const filteredAthletes = athletes.filter(athlete => {
    const fullName = athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : '';
    const email = athlete.email || '';
    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <DashboardLayout title="Athletes Management">
      <div className="space-y-6 max-w-none">
        <AthletesHeader onAthleteAdded={handleAthleteAdded} />
        <StatsCards />
        <SearchFilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <AthletesTable athletes={filteredAthletes} loading={loading} />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Athletes;
