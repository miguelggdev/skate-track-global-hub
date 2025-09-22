import React from 'react';
import { Control } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Settings } from 'lucide-react';

interface ReportTemplateSettingsProps {
  control: Control<any>;
}

const ReportTemplateSettings = ({ control }: ReportTemplateSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Configuración de Reportes
        </CardTitle>
        <CardDescription>
          Personaliza qué información del club aparece en todos los reportes y documentos generados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header Style Selection */}
        <FormField
          control={control}
          name="report_header_style"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Estilo de Encabezado
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || 'full'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estilo de encabezado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="minimal">Mínimo - Solo logo y nombre del club</SelectItem>
                  <SelectItem value="full">Completo - Toda la información disponible</SelectItem>
                  <SelectItem value="corporate">Corporativo - Diseño profesional centrado</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Information Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="report_include_logo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Incluir Logo</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mostrar el logo del club en los reportes
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="report_include_address"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Incluir Dirección</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mostrar la dirección del club
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="report_include_contact"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Incluir Contacto</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mostrar teléfono, email y web
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="report_include_social"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Incluir Redes Sociales</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mostrar enlaces a redes sociales
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="report_include_president"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Incluir Presidente</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mostrar información del presidente
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="report_include_delegate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Incluir Delegado</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mostrar información del delegado
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="report_include_league"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Incluir Liga</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mostrar información de liga y país
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Esta configuración se aplicará a todos los reportes generados, 
            incluyendo reportes financieros, de asistencia, cartas de atletas y recibos de transacciones.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTemplateSettings;