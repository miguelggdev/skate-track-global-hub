import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { EditAthleteFormData } from './schema';

interface FamilyTabProps {
  form: UseFormReturn<EditAthleteFormData>;
}

export function FamilyTab({ form }: FamilyTabProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Información Familiar</h4>

      <div className="space-y-4">
        <h5 className="text-sm font-medium text-muted-foreground">Padre/Madre</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="parent_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Padre/Madre</FormLabel>
              <FormControl><Input placeholder="Nombre completo" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="parent_phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl><Input placeholder="+57 300 000 0000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="parent_email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="email@ejemplo.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <h5 className="text-sm font-medium text-muted-foreground">Tutor/Guardián</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="guardian_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Tutor</FormLabel>
              <FormControl><Input placeholder="Nombre completo" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="guardian_relationship" render={({ field }) => (
            <FormItem>
              <FormLabel>Relación</FormLabel>
              <FormControl><Input placeholder="Tío, abuelo, etc." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="guardian_phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl><Input placeholder="+57 300 000 0000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="guardian_email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="email@ejemplo.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>
    </div>
  );
}
