import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EditAthleteFormData } from './schema';

interface HistoryTabProps {
  form: UseFormReturn<EditAthleteFormData>;
}

export function HistoryTab({ form }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Historial Deportivo</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/30">
        <FormField control={form.control} name="registration_type" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Registro *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ligado">🏅 Ligado (Liga Bogotá)</SelectItem>
                <SelectItem value="federado">🇨🇴 Federado (FCP Nacional)</SelectItem>
                <SelectItem value="escuela">🛼 Escuela / No Ligado</SelectItem>
                <SelectItem value="nuevo">🆕 Nuevo (en proceso)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="registration_number" render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Carné / Registro</FormLabel>
            <FormControl><Input placeholder="Ej: LB-2026-001" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="years_experience" render={({ field }) => (
          <FormItem>
            <FormLabel>Años de Experiencia</FormLabel>
            <FormControl><Input type="number" placeholder="5" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="previous_club" render={({ field }) => (
          <FormItem>
            <FormLabel>Club Anterior</FormLabel>
            <FormControl><Input placeholder="Nombre del club anterior" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="start_date" render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de Inicio en el Deporte</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="league_date" render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de Ingreso a Liga</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="federation_date" render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de Federación</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="is_league" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Participa en Liga</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="is_federated" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Está Federado</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="achievements" render={({ field }) => (
        <FormItem>
          <FormLabel>Logros y Reconocimientos</FormLabel>
          <FormControl>
            <Textarea placeholder="Logros y reconocimientos del atleta..." className="min-h-[80px]" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="bio" render={({ field }) => (
        <FormItem>
          <FormLabel>Biografía</FormLabel>
          <FormControl>
            <Textarea placeholder="Información adicional sobre el atleta..." className="min-h-[80px]" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}
