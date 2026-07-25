import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Crown, Phone, Mail } from 'lucide-react';

interface PresidentInfoProps {
  control: Control<any>;
}

const PresidentInfo = ({ control }: PresidentInfoProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Crown className="h-5 w-5" />
        Información del Presidente
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="president_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Presidente</FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="president_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID del Presidente</FormLabel>
              <FormControl>
                <Input placeholder="DNI/NIE/CIF" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="president_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </FormLabel>
              <FormControl>
                <Input placeholder="+34 600 000 000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="president_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo
              </FormLabel>
              <FormControl>
                <Input type="email" placeholder="presidente@miclub.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PresidentInfo;