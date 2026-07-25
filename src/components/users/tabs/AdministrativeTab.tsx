import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AdministrativeTabProps {
  form: UseFormReturn<any>;
  isAdmin: boolean;
}

export const AdministrativeTab = ({ form, isAdmin }: AdministrativeTabProps) => {
  if (!isAdmin) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>Solo administradores pueden acceder a esta sección</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estado del Usuario</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Estado administrativo del usuario en el sistema
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="observations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observaciones Internas</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Notas internas del club (solo visible para administradores)..."
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Estas notas solo son visibles para administradores
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-4">Consentimientos y Acuerdos</h4>
        
        <FormField
          control={form.control}
          name="data_consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Consentimiento de Datos Personales</FormLabel>
                <FormDescription>
                  El usuario ha aceptado el tratamiento de sus datos personales
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accepts_regulations"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Acepta Reglamento del Club</FormLabel>
                <FormDescription>
                  El usuario ha aceptado el reglamento interno del club
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-4">Información del Sistema</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Fecha de Registro</Label>
            <p className="text-sm">
              {form.watch('created_at') 
                ? new Date(form.watch('created_at')).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'N/A'}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Última Actualización</Label>
            <p className="text-sm">
              {form.watch('updated_at')
                ? new Date(form.watch('updated_at')).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <label className={className}>{children}</label>
);
