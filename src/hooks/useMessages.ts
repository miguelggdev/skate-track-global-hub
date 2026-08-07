import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type MessageRow = Database['public']['Tables']['messages']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export type Message = MessageRow;

export interface SendMessagePayload {
  subject: string;
  body: string;
  to_user_id?: string | null;
  to_role?: UserRole | null;
  parent_id?: string | null;
}

export function useInbox() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['messages-inbox', user?.id, profile?.role],
    queryFn: async () => {
      if (!user) return [];
      const orFilter = profile?.role
        ? `to_user_id.eq.${user.id},to_role.eq.${profile.role}`
        : `to_user_id.eq.${user.id}`;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(orFilter)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    enabled: !!user && !profileLoading,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages-inbox:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['messages-inbox', user.id, profile?.role] });
        qc.invalidateQueries({ queryKey: ['messages-unread-count', user.id, profile?.role] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
}

export function useSentMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['messages-sent', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('from_user_id', user.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    enabled: !!user,
  });
}

export function useThread(messageId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['messages-thread', messageId],
    queryFn: async () => {
      if (!messageId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`id.eq.${messageId},parent_id.eq.${messageId}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    enabled: !!messageId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!messageId || !user) return;
    const channel = supabase
      .channel(`messages-thread:${messageId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['messages-thread', messageId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [messageId, user, qc]);

  return query;
}

export function useUnreadMessageCount() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  return useQuery({
    queryKey: ['messages-unread-count', user?.id, profile?.role],
    queryFn: async () => {
      if (!user) return 0;
      const orFilter = profile?.role
        ? `to_user_id.eq.${user.id},to_role.eq.${profile.role}`
        : `to_user_id.eq.${user.id}`;
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .or(orFilter)
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user && !profileLoading,
    staleTime: 30_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('messages').insert({
        from_user_id: user.id,
        subject: payload.subject,
        body: payload.body,
        to_user_id: payload.to_user_id ?? null,
        to_role: payload.to_role ?? null,
        parent_id: payload.parent_id ?? null,
        status: 'sent',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages-inbox'] });
      qc.invalidateQueries({ queryKey: ['messages-sent'] });
      qc.invalidateQueries({ queryKey: ['messages-thread'] });
      qc.invalidateQueries({ queryKey: ['messages-unread-count'] });
    },
    onError: (error: unknown) => {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'No se pudo enviar el mensaje', variant: 'destructive' });
    },
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages-inbox'] });
      qc.invalidateQueries({ queryKey: ['messages-unread-count'] });
      qc.invalidateQueries({ queryKey: ['messages-thread'] });
    },
  });
}
