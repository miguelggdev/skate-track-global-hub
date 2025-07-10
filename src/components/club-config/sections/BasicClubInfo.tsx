import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';

interface BasicClubInfoProps {
  control: Control<any>;
}

const BasicClubInfo = ({ control }: BasicClubInfoProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="club_name"
          rules={{ required: "El nombre del club es requerido" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Club *</FormLabel>
              <FormControl>
                <Input placeholder="Mi Club de Patinaje" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email de Contacto
              </FormLabel>
              <FormControl>
                <Input type="email" placeholder="contacto@miclub.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono de Contacto
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
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sitio Web
              </FormLabel>
              <FormControl>
                <Input placeholder="https://www.miclub.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección
            </FormLabel>
            <FormControl>
              <Input placeholder="Calle Principal 123, Madrid, España" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="club_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción del Club</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe tu club, su historia, especialidades..."
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default BasicClubInfo;