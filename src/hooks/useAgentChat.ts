import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type AgentId =
  | 'admin' | 'skating' | 'nutrition' | 'gym' | 'medical'
  | 'cycling' | 'psychology' | 'finance' | 'marketing' | 'results'
  | 'security' | 'operations' | 'legal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';
const MAX_STORED = 50;

function storageKey(id: AgentId) { return `agent-chat-${id}`; }

function loadMessages(id: AgentId): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveMessages(id: AgentId, msgs: ChatMessage[]) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(msgs.slice(-MAX_STORED)));
  } catch { /* ignore quota */ }
}

export function useAgentChat(agentId: AgentId) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(agentId));
  const [messagesForAgent, setMessagesForAgent] = useState<AgentId>(agentId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  // Switch agent: reload from storage
  useEffect(() => {
    const loaded = loadMessages(agentId);
    setMessages(loaded);
    setMessagesForAgent(agentId);  // batched with setMessages — same render
    setError(null);
  }, [agentId]);

  // Persist — only when messages belong to the current agent
  useEffect(() => {
    if (messagesForAgent !== agentId) return;  // skip stale saves after agent switch
    saveMessages(agentId, messages);
  }, [agentId, messages, messagesForAgent]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoadingRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const historySnapshot = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg]);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const res = await fetch(`${BACKEND_URL}/api/agents/${agentId}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text, history: historySnapshot }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let doneStreaming = false;
      while (!doneStreaming) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') { doneStreaming = true; break; }
          try {
            const { token } = JSON.parse(payload) as { token: string };
            setMessages(prev =>
              prev.map(m => m.id === assistantId ? { ...m, content: m.content + token } : m)
            );
          } catch { /* malformed line */ }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== assistantId));
        return;
      }
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      let msg = 'Error desconocido';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        msg = 'No se puede conectar con el servidor de agentes. Verifica que el backend esté en línea.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [agentId, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(storageKey(agentId));
  }, [agentId]);

  return { messages, sendMessage, isLoading, error, clearMessages };
}
