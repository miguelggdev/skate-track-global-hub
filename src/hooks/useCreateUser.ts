import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  id_type?: string;
  id_number?: string;
  phone?: string;
  date_of_birth?: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  bio?: string;
  gender?: string;
}

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUser = async (data: CreateUserData) => {
    try {
      setLoading(true);

      const { data: result, error } = await supabase.functions.invoke('create-user-admin', {
        body: {
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          id_type: data.id_type || null,
          id_number: data.id_number || null,
          role: data.role,
          phone: data.phone || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
        }
      });

      if (error) throw new Error(error.message || 'Failed to create user');
      if (!result?.success) throw new Error(result?.error || 'Failed to create user');

      toast({
        title: 'Éxito',
        description: 'Usuario creado exitosamente',
      });

      return { success: true };

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';

      let errorMessage = 'No se pudo crear el usuario';
      if (msg.includes('User with this email already exists') || msg.includes('already registered')) {
        errorMessage = 'Este email ya está registrado';
      } else if (msg.includes('invalid email')) {
        errorMessage = 'Email inválido';
      } else if (msg.includes('weak password') || msg.includes('Password should be')) {
        errorMessage = 'La contraseña es muy débil (mínimo 6 caracteres)';
      } else if (msg.includes('Insufficient permissions')) {
        errorMessage = 'No tienes permisos para crear usuarios';
      } else if (msg) {
        errorMessage = msg;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading };
};
