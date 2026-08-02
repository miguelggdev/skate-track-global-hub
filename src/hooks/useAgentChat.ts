import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type AgentId =
  | 'admin'
  | 'skating'
  | 'nutrition'
  | 'gym'
  | 'medical'
  | 'cycling'
  | 'psychology'
  | 'finance'
  | 'marketing'
  | 'results';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export function useAgentChat(agentId: AgentId) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${BACKEND_URL}/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.response }]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      let msg = 'Error desconocido';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        msg = 'No se puede conectar con el servidor de agentes. Verifica que el backend esté en línea.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, isLoading, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, isLoading, error, clearMessages };
}
