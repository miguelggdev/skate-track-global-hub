import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  first_name: string;
  last_name: string;
  email: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Single optimized query with join - much faster!
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            user_roles!inner(role)
          `)
          .eq('id', user.id)
          .limit(1)
          .single();

        if (profileError) throw profileError;

        // Extract role from joined data
        const userRole = profileData?.role || (profileData?.user_roles as any)?.[0]?.role || 'athlete';
        
        const finalProfile = {
          ...profileData,
          role: userRole
        };

        setProfile(finalProfile);
      } catch (error) {
        console.error('useUserProfile: Error fetching user profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const isAdmin = profile?.role === 'admin';
  const isCoach = profile?.role === 'coach';
  const isAthlete = profile?.role === 'athlete';
  const isDelegate = profile?.role === 'delegate';
  const isLeader = profile?.role === 'leader';
  const isFinance = profile?.role === 'finance';

  return {
    profile,
    loading,
    isAdmin,
    isCoach,
    isAthlete,
    isDelegate,
    isLeader,
    isFinance,
  };
};