import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditAthleteFormData } from './schema';

interface MedicalTabProps {
  form: UseFormReturn<EditAthleteFormData>;
}

export function MedicalTab({ form }: MedicalTabProps) {
  const weight = form.watch('weight');
  const height = form.watch('height');

  const imc = weight && height && height > 0
    ? (weight / Math.pow(height / 100, 2)).toFixed(1)
    : null;
  const imcCategory = imc
    ? (Number(imc) < 18.5 ? 'Bajo peso' : Number(imc) < 25 ? 'Normal' : Number(imc) < 30 ? 'Sobrepeso' : 'Obesidad')
    : null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Información Médica y Física</h4>

      <h5 className="text-sm font-medium text-muted-foreground">Medidas Físicas</h5>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField control={form.control} name="weight" render={({ field }) => (
          <FormItem>
            <FormLabel>Peso (kg)</FormLabel>
            <FormControl><Input type="number" placeholder="70" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="height" render={({ field }) => (
          <FormItem>
            <FormLabel>Altura (cm)</FormLabel>
            <FormControl><Input type="number" placeholder="175" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="size" render={({ field }) => (
          <FormItem>
            <FormLabel>Talla</FormLabel>
            <FormControl><Input placeholder="M" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="blood_type" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Sangre</FormLabel>
            <FormControl><Input placeholder="O+" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="eps" render={({ field }) => (
          <FormItem>
            <FormLabel>EPS / Aseguradora de Salud</FormLabel>
            <FormControl><Input placeholder="Sanitas, Compensar…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="accident_insurance" render={({ field }) => (
          <FormItem>
            <FormLabel>Seguro de Accidentes</FormLabel>
            <FormControl><Input placeholder="Póliza número / aseguradora" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {imc && (
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">IMC calculado:</span>
          <span className="font-bold text-primary">{imc}</span>
          <span className="text-muted-foreground">— {imcCategory}</span>
        </div>
      )}

      <FormField control={form.control} name="lycra_size" render={({ field }) => (
        <FormItem>
          <FormLabel>Talla de Licra / Uniforme</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl>
              <SelectTrigger><SelectValue placeholder="Seleccionar talla…" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '4', '6', '8', '10', '12', '14', '16'].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      <h5 className="text-sm font-medium text-muted-foreground">Historial Médico</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="allergies" render={({ field }) => (
          <FormItem>
            <FormLabel>Alergias</FormLabel>
            <FormControl><Textarea placeholder="Describe alergias conocidas..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="surgeries" render={({ field }) => (
          <FormItem>
            <FormLabel>Cirugías</FormLabel>
            <FormControl><Textarea placeholder="Historial de cirugías..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="injuries" render={({ field }) => (
          <FormItem>
            <FormLabel>Lesiones</FormLabel>
            <FormControl><Textarea placeholder="Lesiones previas..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="fractures" render={({ field }) => (
          <FormItem>
            <FormLabel>Fracturas</FormLabel>
            <FormControl><Textarea placeholder="Fracturas previas…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="limitations" render={({ field }) => (
          <FormItem>
            <FormLabel>Limitaciones (general)</FormLabel>
            <FormControl><Textarea placeholder="Limitaciones físicas generales..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="physical_limitations" render={({ field }) => (
          <FormItem>
            <FormLabel>Limitaciones para Competencia</FormLabel>
            <FormControl><Textarea placeholder="Limitaciones específicas para entrenar o competir…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="medical_notes" render={({ field }) => (
        <FormItem>
          <FormLabel>Notas Médicas Adicionales</FormLabel>
          <FormControl>
            <Textarea placeholder="Información médica relevante..." className="min-h-[80px]" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}
