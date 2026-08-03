import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThread, useSendMessage, useMarkMessageRead } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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

interface ProfileMap {
  [id: string]: { first_name: string; last_name: string; role: string };
}

interface Props {
  message: Message | null;
  profileMap: ProfileMap;
  onClose: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3_600_000);
  const days = Math.floor(h / 24);
  if (h < 1) return 'Hace un momento';
  if (h < 24) return `Hace ${h}h`;
  if (days < 7) return `Hace ${days}d — ${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function senderName(userId: string, profileMap: ProfileMap, currentUserId?: string) {
  if (userId === currentUserId) return 'Tú';
  const p = profileMap[userId];
  if (!p) return 'Usuario';
  return `${p.first_name} ${p.last_name}`;
}

export function MessageThread({ message, profileMap, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replyBody, setReplyBody] = React.useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessageRead();

  const { data: thread = [] } = useThread(message?.id ?? null);

  // Mark as read when opening
  useEffect(() => {
    if (message?.id && !message.read_at && message.to_user_id === user?.id) {
      markRead.mutate(message.id);
    }
  }, [message?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when thread loads or reply is added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleReply = async () => {
    if (!replyBody.trim() || !message) return;
    const rootMessage = thread[0];
    if (!rootMessage) return;

    const replyToUserId = rootMessage.from_user_id === user?.id
      ? rootMessage.to_user_id
      : rootMessage.from_user_id;

    await sendMessage.mutateAsync({
      subject: rootMessage.subject.startsWith('Re:')
        ? rootMessage.subject
        : `Re: ${rootMessage.subject}`,
      body: replyBody.trim(),
      to_user_id: replyToUserId,
      parent_id: rootMessage.id,
    });
    setReplyBody('');
    toast({ title: 'Respuesta enviada' });
  };

  if (!message) return null;

  const rootSenderId = thread[0]?.from_user_id;
  const isToRole = !!message.to_role;

  return (
    <Dialog open={!!message} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-base leading-snug line-clamp-1">{message.subject}</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            {isToRole ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Users className="h-3 w-3" />
                {ROLE_LABELS[message.to_role as UserRole] ?? message.to_role}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs">
                <User className="h-3 w-3" />
                {thread.length} mensaje{thread.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Thread messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {thread.map((msg) => {
            const isMe = msg.from_user_id === user?.id;
            return (
              <div key={msg.id} className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white',
                  isMe ? 'bg-gradient-to-br from-orange-500 to-orange-700' : 'bg-gradient-to-br from-blue-500 to-blue-700',
                )}>
                  {isMe
                    ? (user?.email?.[0] ?? 'Y').toUpperCase()
                    : (profileMap[msg.from_user_id]?.first_name?.[0] ?? '?').toUpperCase()
                  }
                </div>

                {/* Bubble */}
                <div className={cn('max-w-[75%] space-y-1', isMe && 'items-end flex flex-col')}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {senderName(msg.from_user_id, profileMap, user?.id)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <div className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    isMe
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm',
                  )}>
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box — only for direct messages (not role-broadcast to non-sender) */}
        {!isToRole && rootSenderId !== undefined && (
          <div className="border-t border-border px-4 py-3 flex-shrink-0 flex gap-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Escribe una respuesta…"
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <Button
              onClick={handleReply}
              disabled={!replyBody.trim() || sendMessage.isPending}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
