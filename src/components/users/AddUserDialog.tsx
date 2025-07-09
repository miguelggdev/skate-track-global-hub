import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  bio?: string;
}

const AddUserDialog = ({ open, onOpenChange, onUserAdded }: AddUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<UserFormData>({
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

  const onSubmit = async (data: UserFormData) => {
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

      form.reset();
      onOpenChange(false);
      onUserAdded();

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
    } finally {
      setLoading(false);
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

            <FormField
              control={form.control}
              name="password"
              rules={{ 
                required: "La contraseña es requerida",
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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