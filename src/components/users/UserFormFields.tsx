import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
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
import { CreateUserData } from '@/hooks/useCreateUser';

interface UserFormFieldsProps {
  form: UseFormReturn<CreateUserData>;
}

export const UserFormFields = ({ form }: UserFormFieldsProps) => {
  return (
    <>
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
    </>
  );
};