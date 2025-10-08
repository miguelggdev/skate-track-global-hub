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

        // Extract all roles from joined data
        const rolesArray = Array.isArray(profileData?.user_roles) 
          ? profileData.user_roles 
          : [profileData?.user_roles].filter(Boolean);
        
        // Define role priority (highest to lowest)
        const rolePriority: UserProfile['role'][] = ['admin', 'leader', 'coach', 'delegate', 'finance', 'athlete'];
        
        // Find the highest priority role
        const userRole = (rolePriority.find(role => 
          rolesArray.some((r: any) => r?.role === role)
        ) || profileData?.role || 'athlete') as UserProfile['role'];
        
        const finalProfile: UserProfile = {
          id: profileData.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
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