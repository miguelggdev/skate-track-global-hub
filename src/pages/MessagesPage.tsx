import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Inbox, SendHorizonal, Plus, Search, Users, User, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInbox, useSentMessages, useUnreadMessageCount } from '@/hooks/useMessages';
import { ComposeDialog } from '@/components/messages/ComposeDialog';
import { MessageThread } from '@/components/messages/MessageThread';
import type { Message } from '@/hooks/useMessages';
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

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3_600_000);
  const days = Math.floor(h / 24);
  if (h < 1) return 'Ahora';
  if (h < 24) return `${h}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

interface MessageRowItemProps {
  msg: Message;
  profileMap: Record<string, { first_name: string; last_name: string; role: string }>;
  currentUserId?: string;
  variant: 'inbox' | 'sent';
  onClick: () => void;
}

function MessageRowItem({ msg, profileMap, currentUserId, variant, onClick }: MessageRowItemProps) {
  const isUnread = variant === 'inbox' && !msg.read_at;

  const displayName = (() => {
    if (variant === 'inbox') {
      const p = profileMap[msg.from_user_id];
      return p ? `${p.first_name} ${p.last_name}` : 'Usuario';
    }
    if (msg.to_role) return `Todos: ${ROLE_LABELS[msg.to_role as UserRole] ?? msg.to_role}`;
    if (msg.to_user_id) {
      const p = profileMap[msg.to_user_id];
      return p ? `${p.first_name} ${p.last_name}` : 'Usuario';
    }
    return '—';
  })();

  const isRole = !!msg.to_role;

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-b-0',
        'hover:bg-muted/50 cursor-pointer transition-colors',
        isUnread && 'bg-muted/30',
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className={cn(
        'w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5',
        isRole
          ? 'bg-gradient-to-br from-purple-500 to-purple-700'
          : 'bg-gradient-to-br from-blue-500 to-blue-700',
      )}>
        {isRole
          ? <Users className="h-4 w-4" />
          : (displayName[0] ?? '?').toUpperCase()
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm truncate', isUnread ? 'font-semibold text-foreground' : 'text-foreground/80')}>
            {displayName}
          </span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatTime(msg.created_at)}</span>
        </div>
        <p className={cn('text-sm truncate mt-0.5', isUnread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
          {msg.subject}
        </p>
        <p className="text-xs text-muted-foreground/70 truncate mt-0.5 line-clamp-1">
          {msg.body}
        </p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

const MessagesPage = () => {
  const { user } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [search, setSearch] = useState('');

  const { data: inbox = [], isLoading: inboxLoading } = useInbox();
  const { data: sent = [], isLoading: sentLoading } = useSentMessages();
  const { data: unreadCount = 0 } = useUnreadMessageCount();

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

  const profileMap = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const filterMessages = (msgs: Message[]) =>
    search.trim()
      ? msgs.filter((m) =>
          m.subject.toLowerCase().includes(search.toLowerCase()) ||
          m.body.toLowerCase().includes(search.toLowerCase()),
        )
      : msgs;

  const filteredInbox = filterMessages(inbox);
  const filteredSent = filterMessages(sent);

  return (
    <DashboardLayout title="Mensajes">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mensajería Interna</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Comunícate con entrenadores, líderes y deportistas del club
            </p>
          </div>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo mensaje
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mensajes…"
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inbox">
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-3.5 w-3.5" />
              Bandeja
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px] min-w-[16px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <SendHorizonal className="h-3.5 w-3.5" />
              Enviados
            </TabsTrigger>
          </TabsList>

          {/* Inbox */}
          <TabsContent value="inbox" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {inboxLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                  </div>
                ) : filteredInbox.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <Inbox className="h-14 w-14 text-muted-foreground/25" />
                    <p className="font-medium text-muted-foreground">
                      {search ? 'Sin resultados' : 'Bandeja de entrada vacía'}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {search ? 'Prueba con otro término de búsqueda' : 'Los mensajes que recibas aparecerán aquí'}
                    </p>
                    {!search && (
                      <Button variant="outline" size="sm" onClick={() => setComposeOpen(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Enviar primer mensaje
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredInbox.map((msg) => (
                    <MessageRowItem
                      key={msg.id}
                      msg={msg}
                      profileMap={profileMap}
                      currentUserId={user?.id}
                      variant="inbox"
                      onClick={() => setSelectedMessage(msg)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent */}
          <TabsContent value="sent" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {sentLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                  </div>
                ) : filteredSent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <SendHorizonal className="h-14 w-14 text-muted-foreground/25" />
                    <p className="font-medium text-muted-foreground">
                      {search ? 'Sin resultados' : 'Sin mensajes enviados'}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {search ? 'Prueba con otro término' : 'Los mensajes que envíes aparecerán aquí'}
                    </p>
                    {!search && (
                      <Button variant="outline" size="sm" onClick={() => setComposeOpen(true)}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Enviar mensaje
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredSent.map((msg) => (
                    <MessageRowItem
                      key={msg.id}
                      msg={msg}
                      profileMap={profileMap}
                      currentUserId={user?.id}
                      variant="sent"
                      onClick={() => setSelectedMessage(msg)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
      />

      <MessageThread
        message={selectedMessage}
        profileMap={profileMap}
        onClose={() => setSelectedMessage(null)}
      />
    </DashboardLayout>
  );
};

export default MessagesPage;
