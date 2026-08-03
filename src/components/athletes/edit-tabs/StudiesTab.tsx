import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditAthleteFormData } from './schema';

interface StudiesTabProps {
  form: UseFormReturn<EditAthleteFormData>;
}

export function StudiesTab({ form }: StudiesTabProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Información Académica</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="education_level" render={({ field }) => (
          <FormItem>
            <FormLabel>Nivel Educativo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="preescolar">Preescolar</SelectItem>
                <SelectItem value="primaria">Primaria</SelectItem>
                <SelectItem value="secundaria">Secundaria</SelectItem>
                <SelectItem value="bachillerato">Bachillerato</SelectItem>
                <SelectItem value="universidad">Universidad</SelectItem>
                <SelectItem value="posgrado">Posgrado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="current_grade" render={({ field }) => (
          <FormItem>
            <FormLabel>Grado Actual</FormLabel>
            <FormControl><Input placeholder="5to grado" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="school_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Centro Educativo</FormLabel>
            <FormControl><Input placeholder="Nombre del colegio/universidad" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="school_address" render={({ field }) => (
          <FormItem>
            <FormLabel>Dirección del Centro</FormLabel>
            <FormControl><Input placeholder="Dirección completa" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="school_phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono del Centro</FormLabel>
            <FormControl><Input placeholder="+57 300 000 0000" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="school_email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email del Centro</FormLabel>
            <FormControl><Input type="email" placeholder="info@colegio.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
