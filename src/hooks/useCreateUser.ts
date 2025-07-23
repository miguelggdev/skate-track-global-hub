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
      console.log('🚀 Starting user creation process via admin function...');
      console.log('📝 Form data:', data);

      // Call the edge function to create user without affecting current session
      console.log('🔐 Calling create-user-admin function...');
      const { data: result, error } = await supabase.functions.invoke('create-user-admin', {
        body: {
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          phone: data.phone || null,
          date_of_birth: data.date_of_birth || null,
        }
      });

      console.log('🔐 Admin function result:', { result, error });

      if (error) {
        console.error('❌ Error calling create-user-admin function:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (!result?.success) {
        const errorMessage = result?.error || 'Failed to create user';
        console.error('❌ Error from create-user-admin function:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ User created successfully via admin function:', result.user?.id);

      toast({
        title: "Éxito",
        description: "Usuario creado exitosamente",
      });

      return { success: true };

    } catch (error: any) {
      console.error('❌ User creation failed:', error);
      
      let errorMessage = "No se pudo crear el usuario";
      if (error.message?.includes('User with this email already exists') || error.message?.includes('already registered')) {
        errorMessage = "Este email ya está registrado";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "Email inválido";
      } else if (error.message?.includes('weak password') || error.message?.includes('Password should be')) {
        errorMessage = "La contraseña es muy débil (mínimo 6 caracteres)";
      } else if (error.message?.includes('Insufficient permissions')) {
        errorMessage = "No tienes permisos para crear usuarios";
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