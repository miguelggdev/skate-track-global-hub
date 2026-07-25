
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null;
  category: string;
  level: string;
  status: string;
  performance_score: number;
  athlete_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  achievements: string | null;
}

export const useCurrentAthlete = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthlete = async () => {
      if (!user) {
        setAthlete(null);
        setLoading(false);
        return;
      }

      // Only fetch athlete data if user is actually an athlete
      if (profile && profile.role !== 'athlete') {
        setAthlete(null);
        setError(null); // Clear any previous errors
        setLoading(false);
        return;
      }

      // Don't fetch if we don't have profile data yet
      if (!profile) {
        return;
      }

      try {
        console.log('Fetching athlete record for user:', user.id);
        const { data, error } = await supabase
          .from('athletes')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No athlete record found - create one automatically
            console.log('No athlete record found, creating one...');
            await createAthleteRecord(user.id);
            return; // Will trigger useEffect again after creation
          } else {
            console.error('Error fetching athlete:', error);
            throw error;
          }
        } else {
          console.log('Athlete record found:', data);
          setAthlete(data);
          setError(null);
        }
      } catch (error) {
        console.error('Error in fetchAthlete:', error);
        setError('Failed to fetch athlete data');
      } finally {
        setLoading(false);
      }
    };

    fetchAthlete();
  }, [user, profile]);

  const createAthleteRecord = async (userId: string) => {
    try {
      console.log('Creating athlete record for user:', userId);
      
      // Get user profile data to populate athlete record
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, date_of_birth')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile for athlete creation:', profileError);
        throw profileError;
      }

      console.log('Profile data for athlete creation:', profileData);

      const { data, error } = await supabase
        .from('athletes')
        .insert({
          user_id: userId,
          first_name: profileData?.first_name || '',
          last_name: profileData?.last_name || '',
          email: profileData?.email || '',
          date_of_birth: profileData?.date_of_birth,
          category: 'juvenil',
          level: 'juvenil_primer_ano',
          status: 'active',
          performance_score: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating athlete record:', error);
        throw error;
      }
      
      console.log('Athlete record created successfully:', data);
      setAthlete(data);
      setError(null);
    } catch (error) {
      console.error('Error in createAthleteRecord:', error);
      setError('Failed to create athlete record');
    }
  };

  const refreshAthlete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setAthlete(data);
      setError(null);
    } catch (error) {
      console.error('Error refreshing athlete data:', error);
      setError('Failed to refresh athlete data');
    } finally {
      setLoading(false);
    }
  };

  return {
    athlete,
    loading,
    error,
    refreshAthlete,
  };
};
