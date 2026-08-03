import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RagSource {
  document: string;
  page: number | null;
  excerpt: string;
}

export interface RagMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: RagSource[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export function useRagChat() {
  const [messages, setMessages] = useState<RagMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    setMessages(prev => [...prev, { role: 'user', content: question }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const res = await fetch(`${BACKEND_URL}/api/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }

      const data: { answer: string; sources: RagSource[] } = await res.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      let msg = 'Error al consultar documentos';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        msg = 'No se puede conectar con el servidor. Verifica que el backend esté en línea.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, isLoading, error, clearMessages };
}
