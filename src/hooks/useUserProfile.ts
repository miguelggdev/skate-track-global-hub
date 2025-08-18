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
      console.log('useUserProfile: Starting profile fetch for user:', user?.id);
      
      if (!user) {
        console.log('useUserProfile: No user found, clearing profile');
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('useUserProfile: Profile data fetch result:', { 
          data: profileData, 
          error: profileError 
        });

        if (profileError) throw profileError;

        // Fetch user role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('useUserProfile: Role data fetch result:', { 
          data: roleData, 
          error: roleError 
        });

        if (roleError) {
          console.warn('useUserProfile: Role fetch error (non-fatal):', roleError);
        }

        // Prefer profile role if it exists, fallback to user_roles
        const userRole = profileData?.role || roleData?.[0]?.role || 'athlete';
        
        console.log('useUserProfile: Final role determined:', {
          profileRole: profileData?.role,
          userRolesRole: roleData?.[0]?.role,
          finalRole: userRole
        });
        
        const finalProfile = {
          ...profileData,
          role: userRole
        };

        console.log('useUserProfile: Setting final profile:', finalProfile);
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