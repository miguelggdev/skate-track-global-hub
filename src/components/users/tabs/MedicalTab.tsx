import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MedicalTabProps {
  form: UseFormReturn<any>;
}

export const MedicalTab = ({ form }: MedicalTabProps) => {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="blood_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo Sanguíneo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="AB">AB</SelectItem>
                  <SelectItem value="O">O</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rh_factor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Factor RH</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="+">Positivo (+)</SelectItem>
                  <SelectItem value="-">Negativo (-)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="diseases"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enfermedades</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enfermedades diagnosticadas..."
                className="min-h-[60px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="allergies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alergias</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Alergias a medicamentos o alimentos..."
                className="min-h-[60px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="disability"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discapacidad</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Si aplica..."
                className="min-h-[60px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-4">Contacto de Emergencia</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="María García" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <FormControl>
                  <Input placeholder="Madre, Padre, Pareja..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="emergency_contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono de Emergencia</FormLabel>
              <FormControl>
                <Input placeholder="+57 300 000 0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-4">Seguros</h4>
        
        <FormField
          control={form.control}
          name="health_insurance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>EPS / Seguro Médico</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la EPS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sports_insurance_policy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Póliza Deportiva</FormLabel>
                <FormControl>
                  <Input placeholder="Número de póliza" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_expiry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Expiración</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
