import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUpload } from '@/components/users/PhotoUpload';
import { EditAthleteFormData } from './schema';

interface PersonalTabProps {
  form: UseFormReturn<EditAthleteFormData>;
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  userId?: string;
  currentAvatarUrl?: string;
}

export function PersonalTab({ form, photoUrl, onPhotoChange, userId, currentAvatarUrl }: PersonalTabProps) {
  return (
    <div className="space-y-4">
      {userId && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <PhotoUpload
            currentPhotoUrl={photoUrl || currentAvatarUrl || undefined}
            onPhotoChange={onPhotoChange}
            userId={userId}
            className="max-w-md mx-auto"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="date_of_birth" render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de Nacimiento</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="gender" render={({ field }) => (
          <FormItem>
            <FormLabel>Género</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar género" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="femenino">Femenino</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="id_type" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Documento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Tarjeta de identidad">Tarjeta de Identidad</SelectItem>
                <SelectItem value="Cedula de Ciudadania">Cédula de Ciudadanía</SelectItem>
                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                <SelectItem value="Cedula de Extranjeria">Cédula de Extranjería</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="id_number" render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Documento</FormLabel>
            <FormControl><Input placeholder="12345678X" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="phone" render={({ field }) => (
        <FormItem>
          <FormLabel>Teléfono</FormLabel>
          <FormControl><Input placeholder="+57 300 000 0000" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <h5 className="text-sm font-medium text-muted-foreground pt-2">Ubicación</h5>
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="city_of_birth" render={({ field }) => (
          <FormItem>
            <FormLabel>Ciudad de Nacimiento</FormLabel>
            <FormControl><Input placeholder="Bogotá" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="neighborhood" render={({ field }) => (
          <FormItem>
            <FormLabel>Barrio</FormLabel>
            <FormControl><Input placeholder="Kennedy" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="nationality" render={({ field }) => (
          <FormItem>
            <FormLabel>Nacionalidad</FormLabel>
            <FormControl><Input placeholder="colombiana" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="country" render={({ field }) => (
          <FormItem>
            <FormLabel>País</FormLabel>
            <FormControl><Input placeholder="Colombia" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
