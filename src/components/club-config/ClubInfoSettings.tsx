import React from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClubSettings } from '@/pages/ClubConfig';
import { Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';

interface ClubInfoSettingsProps {
  clubSettings: ClubSettings | null;
  onUpdate: () => void;
}

const ClubInfoSettings = ({ clubSettings, onUpdate }: ClubInfoSettingsProps) => {
  const form = useForm({
    defaultValues: {
      club_name: clubSettings?.club_name || '',
      club_description: clubSettings?.club_description || '',
      contact_email: clubSettings?.contact_email || '',
      contact_phone: clubSettings?.contact_phone || '',
      address: clubSettings?.address || '',
      website_url: clubSettings?.website_url || '',
      social_facebook: clubSettings?.social_facebook || '',
      social_instagram: clubSettings?.social_instagram || '',
      social_twitter: clubSettings?.social_twitter || '',
      timezone: clubSettings?.timezone || 'Europe/Madrid',
      currency: clubSettings?.currency || 'EUR',
      language: clubSettings?.language || 'es',
    },
  });

  React.useEffect(() => {
    if (clubSettings) {
      form.reset({
        club_name: clubSettings.club_name || '',
        club_description: clubSettings.club_description || '',
        contact_email: clubSettings.contact_email || '',
        contact_phone: clubSettings.contact_phone || '',
        address: clubSettings.address || '',
        website_url: clubSettings.website_url || '',
        social_facebook: clubSettings.social_facebook || '',
        social_instagram: clubSettings.social_instagram || '',
        social_twitter: clubSettings.social_twitter || '',
        timezone: clubSettings.timezone || 'Europe/Madrid',
        currency: clubSettings.currency || 'EUR',
        language: clubSettings.language || 'es',
      });
    }
  }, [clubSettings, form]);

  const onSubmit = async (data: any) => {
    try {
      if (!clubSettings?.id) {
        // Create new club settings
        const { error } = await supabase
          .from('club_settings')
          .insert([data]);
        
        if (error) throw error;
      } else {
        // Update existing club settings
        const { error } = await supabase
          .from('club_settings')
          .update(data)
          .eq('id', clubSettings.id);
        
        if (error) throw error;
      }
      
      onUpdate();
    } catch (error) {
      console.error('Error updating club settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información del Club
          </CardTitle>
          <CardDescription>
            Configura la información básica y los datos de contacto del club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
                control={form.control}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona Horaria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar zona horaria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                          <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                          <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Los Ángeles (GMT-8)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                          <SelectItem value="USD">Dólar ($)</SelectItem>
                          <SelectItem value="GBP">Libra (£)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Redes Sociales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="social_facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/miclub" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social_instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/miclub" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social_twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/miclub" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">
                  Guardar Configuración
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubInfoSettings;