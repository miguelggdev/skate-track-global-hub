import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfessionalTabProps {
  form: UseFormReturn<any>;
}

export const ProfessionalTab = ({ form }: ProfessionalTabProps) => {
  return (
    <div className="space-y-4 py-4">
      <h3 className="font-medium text-lg">Formación Académica</h3>
      
      <FormField
        control={form.control}
        name="academic_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nivel Académico</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione nivel" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="bachiller">Bachiller</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="profesional">Profesional</SelectItem>
                <SelectItem value="licenciado">Licenciado</SelectItem>
                <SelectItem value="posgrado">Posgrado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="degree_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título Obtenido</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Licenciado en Educación Física" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="education_institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institución</FormLabel>
              <FormControl>
                <Input placeholder="Universidad o centro educativo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="training_certifications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certificaciones</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Certificaciones y cursos relevantes..."
                className="min-h-[80px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border-t pt-4 mt-4">
        <h3 className="font-medium text-lg mb-4">Experiencia Profesional</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="years_experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Años de Experiencia</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coach_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría de Entrenador</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="formador">Formador</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="asistente">Asistente</SelectItem>
                    <SelectItem value="alto_rendimiento">Alto Rendimiento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="experience_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción de Experiencia</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe tu experiencia profesional..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-medium text-lg mb-4">Licencias y Certificación</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Licencia</FormLabel>
                <FormControl>
                  <Input placeholder="Licencia federación" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="federation_license_expiry"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="certification_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel de Certificación</FormLabel>
                <FormControl>
                  <Input placeholder="Nivel 1, Nivel 2, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hourly_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarifa por Hora</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especialización</FormLabel>
              <FormControl>
                <Input placeholder="Área de especialización" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
