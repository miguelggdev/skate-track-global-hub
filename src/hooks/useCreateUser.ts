import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  bio?: string;
}

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUser = async (data: CreateUserData) => {
    try {
      setLoading(true);
      console.log('🚀 Starting user creation process...');
      console.log('📝 Form data:', data);

      // Create auth user with email confirmation disabled
      console.log('🔐 Creating authentication user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role,
          },
        }
      });

      console.log('🔐 Auth result:', { 
        userId: authData.user?.id, 
        userExists: !!authData.user,
        needsConfirmation: !authData.user?.email_confirmed_at,
        error: authError 
      });
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Check if profile was created by trigger
      console.log('🔍 Checking if profile was created by trigger...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for trigger

      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('🔍 Profile check result:', { 
        profileExists: !!profileCheck, 
        profileData: profileCheck,
        error: profileCheckError 
      });

      // If profile doesn't exist, create it manually (fallback)
      if (!profileCheck && profileCheckError) {
        console.log('🔧 Profile not found, creating manually...');
        const { error: manualProfileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role,
            phone: data.phone || null,
            date_of_birth: data.date_of_birth || null,
            bio: data.bio || null,
          });

        if (manualProfileError) {
          console.error('❌ Manual profile creation failed:', manualProfileError);
          throw new Error('No se pudo crear el perfil del usuario');
        }
        console.log('✅ Profile created manually');
      } else {
        // Update profile with additional data
        console.log('🔄 Updating profile with additional data...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            phone: data.phone || null,
            date_of_birth: data.date_of_birth || null,
            bio: data.bio || null,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('⚠️ Profile update failed:', updateError);
          // Don't throw error as basic profile exists
        } else {
          console.log('✅ Profile updated successfully');
        }
      }

      // Final verification
      const { data: finalCheck } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('✅ Final verification - User created successfully:', {
        authUserId: authData.user.id,
        profileExists: !!finalCheck,
        profileData: finalCheck
      });

      toast({
        title: "Éxito",
        description: "Usuario creado exitosamente",
      });

      return { success: true };

    } catch (error: any) {
      console.error('❌ User creation failed:', error);
      
      let errorMessage = "No se pudo crear el usuario";
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        errorMessage = "Este email ya está registrado";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "Email inválido";
      } else if (error.message?.includes('weak password') || error.message?.includes('Password should be')) {
        errorMessage = "La contraseña es muy débil (mínimo 6 caracteres)";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading };
};