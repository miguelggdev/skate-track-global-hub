-- Fix the critical security vulnerability in profiles table
-- Remove the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure, role-based access policies for profiles table

-- Allow users to view only their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow staff roles to view profiles for legitimate business purposes
CREATE POLICY "Staff can view profiles for management" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coach', 'leader', 'delegate')
  )
);

-- Allow admins and leaders to manage all profiles (for user management functionality)
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'leader')
  )
);