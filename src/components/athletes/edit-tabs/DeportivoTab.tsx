import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditAthleteFormData } from './schema';

interface DeportivoTabProps {
  form: UseFormReturn<EditAthleteFormData>;
}

export function DeportivoTab({ form }: DeportivoTabProps) {
  return (
    <div className="space-y-6">
      <h4 className="font-medium">Perfil Deportivo</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="specialty" render={({ field }) => (
          <FormItem>
            <FormLabel>Especialidad</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar especialidad…" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="fondista">Fondista</SelectItem>
                <SelectItem value="velocista">Velocista</SelectItem>
                <SelectItem value="omnium">Ómnium</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="personal_phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono Personal</FormLabel>
            <FormControl><Input type="tel" placeholder="300 123 4567" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
