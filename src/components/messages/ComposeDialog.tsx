import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Users, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSendMessage } from '@/hooks/useMessages';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administradores',
  leader: 'Líderes',
  coach: 'Entrenadores',
  delegate: 'Delegados',
  finance: 'Finanzas',
  athlete: 'Deportistas',
};

const ALL_ROLES: UserRole[] = ['admin', 'leader', 'coach', 'delegate', 'finance', 'athlete'];

const schema = z.object({
  recipientType: z.enum(['user', 'role']),
  to_user_id: z.string().optional(),
  to_role: z.enum(['admin', 'leader', 'coach', 'delegate', 'finance', 'athlete']).optional(),
  subject: z.string().min(1, 'El asunto es obligatorio'),
  body: z.string().min(1, 'El mensaje no puede estar vacío'),
}).superRefine((d, ctx) => {
  if (d.recipientType === 'user' && !d.to_user_id) {
    ctx.addIssue({ code: 'custom', message: 'Selecciona un usuario', path: ['to_user_id'] });
  }
  if (d.recipientType === 'role' && !d.to_role) {
    ctx.addIssue({ code: 'custom', message: 'Selecciona un rol', path: ['to_role'] });
  }
});

type FormValues = z.infer<typeof schema>;

export interface ReplyTo {
  id: string;
  subject: string;
  from_user_id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  replyTo?: ReplyTo;
}

export function ComposeDialog({ open, onClose, replyTo }: Props) {
  const { toast } = useToast();
  const sendMessage = useSendMessage();

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .order('last_name');
      return (data ?? []) as { id: string; first_name: string; last_name: string; role: string }[];
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipientType: 'user',
      subject: '',
      body: '',
    },
  });

  const recipientType = form.watch('recipientType');

  React.useEffect(() => {
    if (open) {
      form.reset({
        recipientType: 'user',
        subject: replyTo ? `Re: ${replyTo.subject}` : '',
        body: '',
        to_user_id: replyTo ? replyTo.from_user_id : undefined,
        to_role: undefined,
      });
    }
  }, [open, replyTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: FormValues) => {
    await sendMessage.mutateAsync({
      subject: values.subject,
      body: values.body,
      to_user_id: replyTo
        ? replyTo.from_user_id
        : values.recipientType === 'user' ? (values.to_user_id ?? null) : null,
      to_role: !replyTo && values.recipientType === 'role' ? (values.to_role ?? null) : null,
      parent_id: replyTo?.id ?? null,
    });
    toast({ title: 'Mensaje enviado', description: 'Tu mensaje fue enviado correctamente.' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {replyTo ? 'Responder mensaje' : 'Nuevo mensaje'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Recipient — only shown for new messages */}
            {!replyTo && (
              <>
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de destinatario</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">
                            <span className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" /> Usuario específico
                            </span>
                          </SelectItem>
                          <SelectItem value="role">
                            <span className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5" /> Todos de un rol
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {recipientType === 'user' ? (
                  <FormField
                    control={form.control}
                    name="to_user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destinatario</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar usuario…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {profiles.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.last_name}, {p.first_name}
                                <span className="text-muted-foreground ml-1.5 text-xs">
                                  ({ROLE_LABELS[p.role as UserRole] ?? p.role})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="to_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol destinatario</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar rol…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ALL_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Asunto del mensaje…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Escribe tu mensaje…" rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={sendMessage.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {sendMessage.isPending ? 'Enviando…' : 'Enviar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
