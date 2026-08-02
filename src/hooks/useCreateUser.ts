import { useMutation } from '@tanstack/react-query';
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

const parseErrorMessage = (msg: string): string => {
  if (msg.includes('User with this email already exists') || msg.includes('already registered'))
    return 'Este email ya está registrado';
  if (msg.includes('invalid email'))
    return 'Email inválido';
  if (msg.includes('weak password') || msg.includes('Password should be'))
    return 'La contraseña es muy débil (mínimo 6 caracteres)';
  if (msg.includes('Insufficient permissions'))
    return 'No tienes permisos para crear usuarios';
  return msg || 'No se pudo crear el usuario';
};

export const useCreateUser = () => {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const { data: result, error } = await supabase.functions.invoke('create-user-admin', {
        body: {
          email:          data.email,
          password:       data.password,
          first_name:     data.first_name,
          last_name:      data.last_name,
          id_type:        data.id_type        ?? null,
          id_number:      data.id_number      ?? null,
          role:           data.role,
          phone:          data.phone          ?? null,
          date_of_birth:  data.date_of_birth  ?? null,
          gender:         data.gender         ?? null,
        },
      });

      if (error) throw new Error(error.message || 'Failed to create user');
      if (!result?.success) throw new Error(result?.error || 'Failed to create user');
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Usuario creado exitosamente' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: parseErrorMessage(error.message),
        variant: 'destructive',
      });
    },
  });

  const createUser = async (data: CreateUserData): Promise<{ success: boolean; error?: string }> => {
    try {
      await mutation.mutateAsync(data);
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      return { success: false, error: parseErrorMessage(msg) };
    }
  };

  return { createUser, loading: mutation.isPending };
};
