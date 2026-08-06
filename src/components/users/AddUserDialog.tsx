import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser } from '@/hooks/useCreateUser';
import { UserFormFields } from './UserFormFields';
import { supabase } from '@/integrations/supabase/client';

const addUserSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'coach', 'athlete', 'delegate', 'leader', 'finance']),
  bio: z.string().optional().or(z.literal('')),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const AddUserDialog = ({ open, onOpenChange, onUserAdded }: AddUserDialogProps) => {
  const { createUser, loading } = useCreateUser();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      date_of_birth: '',
      role: 'athlete',
      bio: '',
    },
  });

  const onSubmit = async (data: AddUserFormData) => {
    const result = await createUser(data);
    
    if (result.success) {
      form.reset();
      setPhotoUrl(null);
      onOpenChange(false);
      onUserAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Complete la información para crear un nuevo usuario en el sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <UserFormFields 
              form={form} 
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;