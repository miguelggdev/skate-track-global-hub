import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditAthleteFormData, CATEGORY_LABELS, LEVEL_LABELS, STATUS_LABELS } from './schema';

interface BasicTabProps {
  form: UseFormReturn<EditAthleteFormData>;
}

const CATEGORIES = ['youth', 'junior', 'juvenil', 'senior', 'escuela', 'mayores', 'masters', 'menores', 'transicion', 'prejuvenil'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced', 'professional', 'escuela', 'escuela_menores', 'mini_infantil', 'pre_infantil', 'infantil', 'junior', 'transicion', 'pre_juvenil', 'prejuveniles', 'juvenil_primer_ano', 'juvenil_segundo_ano', 'juvenil_tercer_ano', 'mayores', 'mayores_unica'] as const;
const STATUSES = ['active', 'inactive', 'injured', 'suspended'] as const;

export function BasicTab({ form }: BasicTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="first_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre *</FormLabel>
            <FormControl><Input placeholder="Juan" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="last_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Apellido *</FormLabel>
            <FormControl><Input placeholder="Pérez" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="email" render={({ field }) => (
        <FormItem>
          <FormLabel>Email *</FormLabel>
          <FormControl><Input type="email" placeholder="usuario@email.com" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-3 gap-4">
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Categoría *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="level" render={({ field }) => (
          <FormItem>
            <FormLabel>Nivel *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {LEVELS.map(lvl => (
                  <SelectItem key={lvl} value={lvl}>{LEVEL_LABELS[lvl] ?? lvl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Estado *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="athlete_number" render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Atleta</FormLabel>
            <FormControl><Input placeholder="A001" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="performance_score" render={({ field }) => (
          <FormItem>
            <FormLabel>Puntuación de Rendimiento (0-100)</FormLabel>
            <FormControl><Input type="number" min="0" max="100" placeholder="85" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
