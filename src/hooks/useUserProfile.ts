import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
}

const ROLE_PRIORITY: UserProfile['role'][] = ['admin', 'leader', 'coach', 'delegate', 'finance', 'athlete'];

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
        // Profiles table has no role column — role lives exclusively in user_roles
        const [{ data: profileData, error: profileError }, { data: rolesData, error: rolesError }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('id, email, first_name, last_name, phone, avatar_url')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id),
          ]);

        if (profileError) throw profileError;
        if (rolesError) throw rolesError;

        const roles = (rolesData || []).map((r) => r.role as UserProfile['role']);
        const userRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? 'athlete';

        setProfile({
          id: user.id,
          email: profileData?.email || user.email || '',
          first_name: profileData?.first_name || '',
          last_name: profileData?.last_name || '',
          role: userRole,
          phone: profileData?.phone,
          avatar_url: profileData?.avatar_url,
        });
      } catch (error) {
        console.error('useUserProfile: error fetching profile', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    isAdmin:    profile?.role === 'admin',
    isCoach:    profile?.role === 'coach',
    isAthlete:  profile?.role === 'athlete',
    isDelegate: profile?.role === 'delegate',
    isLeader:   profile?.role === 'leader',
    isFinance:  profile?.role === 'finance',
  };
};
