import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  avatar_url?: string | null;
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
        // Query 1: Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, phone, city, country, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Query 2: Fetch all roles for this user
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        // Extract roles and apply priority
        const roles = (rolesData || []).map((r: any) => r.role);
        
        // Define role priority (highest to lowest)
        const rolePriority: UserProfile['role'][] = ['admin', 'leader', 'coach', 'delegate', 'finance', 'athlete'];
        
        // Find the highest priority role from user_roles, fallback to profiles.role, then 'athlete'
        const userRole = (rolePriority.find(role => roles.includes(role)) 
          || profileData?.role 
          || 'athlete') as UserProfile['role'];
        
        // Build profile object with safe defaults
        const finalProfile: UserProfile = {
          id: user.id,
          email: profileData?.email || user.email || '',
          first_name: profileData?.first_name || '',
          last_name: profileData?.last_name || '',
          role: userRole,
          phone: profileData?.phone,
          city: profileData?.city,
          country: profileData?.country,
          avatar_url: profileData?.avatar_url
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