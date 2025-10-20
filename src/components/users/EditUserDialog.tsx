import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/pages/UserManagement';
import { PhotoUpload } from './PhotoUpload';

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

interface EditUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  bio?: string;
  id_type?: 'Tarjeta de identidad' | 'Cedula de Ciudadania' | 'Pasaporte' | 'Cedula de Extranjeria';
  id_number?: string;
}

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isLeader } = useUserProfile();
  
  // Check if current user can edit roles
  const canEditRoles = isAdmin || isLeader;
  
  const form = useForm<EditUserFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      role: 'athlete',
      bio: '',
      id_type: undefined,
      id_number: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        role: user.role,
        bio: user.bio || '',
        id_type: user.id_type || undefined,
        id_number: user.id_number || '',
      });
      setPhotoUrl(user.avatar_url || null);
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    try {
      setLoading(true);

      // Handle photo upload if there's a new photo
      let finalPhotoUrl = photoUrl;
      if (photoUrl && photoUrl.startsWith('blob:')) {
        try {
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
          
          const fileName = `${user.id}/profile.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(fileName, file, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('profiles')
              .getPublicUrl(fileName);
            finalPhotoUrl = urlData.publicUrl;
          }
        } catch (uploadError) {
          console.error('Error uploading photo:', uploadError);
        }
      }

      // Prepare update data - only include role if user has permission
      const updateData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        bio: data.bio,
        avatar_url: finalPhotoUrl,
        id_type: data.id_type,
        id_number: data.id_number,
        updated_at: new Date().toISOString(),
      };

      // Only allow role updates for admins and leaders
      if (canEditRoles) {
        updateData.role = data.role;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario actualizado exitosamente",
      });

      onOpenChange(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información del usuario seleccionado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Photo Upload */}
            <PhotoUpload
              currentPhotoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              userId={user.id}
              className="mb-4"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                rules={{ required: "El apellido es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: "El email es requerido",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Email inválido"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {canEditRoles ? (
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="athlete">Atleta</SelectItem>
                          <SelectItem value="coach">Entrenador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="delegate">Delegado</SelectItem>
                          <SelectItem value="leader">Líder</SelectItem>
                          <SelectItem value="finance">Finanzas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-2">
                  <FormLabel>Rol</FormLabel>
                  <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground">
                    {user.role === 'admin' ? 'Administrador' :
                     user.role === 'coach' ? 'Entrenador' :
                     user.role === 'delegate' ? 'Delegado' :
                     user.role === 'leader' ? 'Líder' :
                     user.role === 'finance' ? 'Finanzas' : 'Atleta'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solo administradores y líderes pueden cambiar roles
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+34 600 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el tipo de documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tarjeta de identidad">Tarjeta de identidad</SelectItem>
                        <SelectItem value="Cedula de Ciudadania">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Cedula de Extranjeria">Cédula de Extranjería</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el número de documento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografía</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información adicional sobre el usuario..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;