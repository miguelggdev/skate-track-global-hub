import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AthleteWheelManager } from '@/components/athletes/AthleteWheelManager';
import { EditAthleteFormData } from './schema';

interface EquipmentTabProps {
  form: UseFormReturn<EditAthleteFormData>;
  athleteId: string;
}

export function EquipmentTab({ form, athleteId }: EquipmentTabProps) {
  const dateOfBirth = form.watch('date_of_birth');

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Equipamiento de Patinaje</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="boot_size" render={({ field }) => (
          <FormItem>
            <FormLabel>Talla de Bota</FormLabel>
            <FormControl><Input type="number" placeholder="42" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="wheel_diameter" render={({ field }) => (
          <FormItem>
            <FormLabel>Diámetro de Rueda (mm)</FormLabel>
            <FormControl><Input type="number" placeholder="110" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="frame_size" render={({ field }) => (
          <FormItem>
            <FormLabel>Talla de Chasis</FormLabel>
            <FormControl><Input placeholder="4x110" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="boot_brand" render={({ field }) => (
          <FormItem>
            <FormLabel>Marca de Bota</FormLabel>
            <FormControl><Input placeholder="Rollerblade" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="frame_brand" render={({ field }) => (
          <FormItem>
            <FormLabel>Marca de Chasis</FormLabel>
            <FormControl><Input placeholder="Powerslide" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="track_wheels_brand" render={({ field }) => (
          <FormItem>
            <FormLabel>Marca de Ruedas</FormLabel>
            <FormControl><Input placeholder="Matter" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="helmet_brand" render={({ field }) => (
          <FormItem>
            <FormLabel>Marca de Casco</FormLabel>
            <FormControl><Input placeholder="Bontrager" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <AthleteWheelManager
        athleteId={athleteId}
        athleteDateOfBirth={dateOfBirth}
      />
    </div>
  );
}
