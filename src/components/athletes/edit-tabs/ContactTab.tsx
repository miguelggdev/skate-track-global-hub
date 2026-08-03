import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { EditAthleteFormData } from './schema';

interface ContactTabProps {
  form: UseFormReturn<EditAthleteFormData>;
}

export function ContactTab({ form }: ContactTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Contacto de Emergencia</FormLabel>
            <FormControl><Input placeholder="Nombre del contacto" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono de Emergencia</FormLabel>
            <FormControl><Input placeholder="+57 300 000 0000" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
