import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Plus, ShieldCheck, LogOut, Send } from 'lucide-react';

interface ClubRow {
  id: string;
  name: string;
  custom_domain: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

const onboardSchema = z.object({
  club_name: z.string().min(2, 'Nombre requerido'),
  custom_domain: z.string().min(3, 'Dominio requerido')
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, 'Dominio inválido'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contact_phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  admin_name: z.string().min(2, 'Nombre requerido'),
  admin_email: z.string().email('Email inválido'),
});
type OnboardFormData = z.infer<typeof onboardSchema>;

const useClubs = () => useQuery({
  queryKey: ['superadmin-clubs'],
  queryFn: async (): Promise<ClubRow[]> => {
    const { data, error } = await supabase
      .from('clubs')
      .select('id, name, custom_domain, city, country, is_active, onboarding_completed, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

const useOwnTelegramChatId = (userId?: string) => useQuery({
  queryKey: ['platform-admin-telegram', userId],
  queryFn: async (): Promise<string> => {
    const { data, error } = await supabase
      .from('platform_admins')
      .select('telegram_chat_id')
      .eq('user_id', userId!)
      .maybeSingle();
    if (error) throw error;
    return data?.telegram_chat_id ?? '';
  },
  enabled: !!userId,
});

const SuperAdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: clubs = [], isLoading } = useClubs();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: ownChatId = '' } = useOwnTelegramChatId(user?.id);
  const [chatIdInput, setChatIdInput] = useState('');

  useEffect(() => {
    setChatIdInput(ownChatId);
  }, [ownChatId]);

  const saveChatIdMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase
        .from('platform_admins')
        .update({ telegram_chat_id: chatId || null })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admin-telegram', user?.id] });
      toast({ title: 'Guardado', description: 'Chat ID de Telegram actualizado' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar el Chat ID', variant: 'destructive' });
    },
  });

  const form = useForm<OnboardFormData>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      club_name: '', custom_domain: '', address: '', city: '', country: 'Colombia',
      contact_phone: '', mobile_phone: '', admin_name: '', admin_email: '',
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('clubs').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-clubs'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado del club', variant: 'destructive' });
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async (values: OnboardFormData) => {
      const { data, error } = await supabase.functions.invoke('superadmin-onboard-club', {
        body: values,
      });
      if (error) throw new Error(error.message || 'Error al crear el club');
      if (!data?.success) throw new Error(data?.error || 'Error al crear el club');
      return data;
    },
    onSuccess: (data) => {
      toast({ title: 'Club creado', description: data.message ?? 'Se envió el correo de configuración al administrador' });
      queryClient.invalidateQueries({ queryKey: ['superadmin-clubs'] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Panel de Plataforma</h1>
              <p className="text-sm text-muted-foreground">Alta y gestión de clubes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo club
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Dar de alta un club nuevo</DialogTitle>
                  <DialogDescription>
                    Se crea el club y se invita a su administrador por correo — no se genera ninguna
                    contraseña temporal, el admin la define desde el enlace que reciba.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((v) => onboardMutation.mutate(v))}
                    className="space-y-4"
                  >
                    <FormField control={form.control} name="club_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del club</FormLabel>
                        <FormControl><Input placeholder="Club Patinadores Bogotá" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="custom_domain" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL personalizada / subdominio</FormLabel>
                        <FormControl><Input placeholder="clubpatinadores.arkanatech.tech" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="contact_phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono fijo</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="mobile_phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono móvil</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="pt-2 border-t border-border space-y-4">
                      <p className="text-sm font-medium text-foreground">Administrador del club</p>
                      <FormField control={form.control} name="admin_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="admin_email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <Button type="submit" className="w-full" disabled={onboardMutation.isPending}>
                      {onboardMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</>
                      ) : 'Crear club e invitar administrador'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={() => signOut()} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clubes</CardTitle>
            <CardDescription>{clubs.length} club{clubs.length !== 1 ? 'es' : ''} registrado{clubs.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club</TableHead>
                      <TableHead>Dominio</TableHead>
                      <TableHead className="hidden sm:table-cell">Ciudad</TableHead>
                      <TableHead>Onboarding</TableHead>
                      <TableHead className="text-right">Activo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clubs.map((club) => (
                      <TableRow key={club.id}>
                        <TableCell className="font-medium">{club.name}</TableCell>
                        <TableCell className="text-muted-foreground">{club.custom_domain ?? '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {[club.city, club.country].filter(Boolean).join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={club.onboarding_completed ? 'secondary' : 'outline'}>
                            {club.onboarding_completed ? 'Completo' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={club.is_active}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: club.id, is_active: checked })}
                            aria-label={`${club.is_active ? 'Desactivar' : 'Activar'} ${club.name}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {clubs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Sin clubes registrados todavía
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Notificaciones de Infraestructura
            </CardTitle>
            <CardDescription>
              Alertas por Telegram del servidor y contenedores (no depende de ningún club) —
              contenedor caído, fallo o éxito de un deploy, espacio en disco.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escribile cualquier mensaje al bot en Telegram y te va a responder con tu Chat ID.
              Pegalo acá para activar las alertas.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                placeholder="Chat ID (ej: 123456789)"
                className="sm:max-w-xs"
              />
              <Button
                onClick={() => saveChatIdMutation.mutate(chatIdInput)}
                disabled={saveChatIdMutation.isPending || chatIdInput === ownChatId}
              >
                {saveChatIdMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
                ) : 'Guardar'}
              </Button>
            </div>
            <Badge variant={ownChatId ? 'secondary' : 'outline'}>
              {ownChatId ? 'Alertas activas' : 'Sin configurar'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
