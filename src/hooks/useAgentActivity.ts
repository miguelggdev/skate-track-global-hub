import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentActivity {
  agent_id: string;        // 'AG-01' … 'AG-13'
  automation_id: string;
  status: 'success' | 'error' | 'skipped';
  summary: string | null;
  ran_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const WORKING_MS = 6000;

/** Última actividad por agente (código AG-XX → registro más reciente). */
async function fetchLatestByAgent(): Promise<Record<string, AgentActivity>> {
  if (!SUPABASE_URL || !ANON_KEY) return {};
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};

  // PostgREST directo: la tabla aún no está en los tipos generados y respetamos RLS
  // con el JWT del usuario (políticas admin/leader).
  const url =
    `${SUPABASE_URL}/rest/v1/agent_activity_log` +
    `?select=agent_id,automation_id,status,summary,ran_at&order=ran_at.desc&limit=200`;
  const res = await fetch(url, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!res.ok) return {};

  const rows = (await res.json()) as AgentActivity[];
  const latest: Record<string, AgentActivity> = {};
  for (const row of rows) {
    if (!latest[row.agent_id]) latest[row.agent_id] = row; // primero = más reciente
  }
  return latest;
}

/**
 * Estado de actividad de los agentes para la galería en vivo:
 * - `lastByAgent`: última ejecución conocida por código AG-XX.
 * - `workingCodes`: agentes que "acaban de trabajar" (INSERT reciente vía Realtime),
 *   se limpian solos tras unos segundos para animar el estado "trabajando".
 */
export function useAgentActivity() {
  const queryClient = useQueryClient();
  const [workingCodes, setWorkingCodes] = useState<Set<string>>(new Set());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { data: lastByAgent = {}, isLoading, error } = useQuery({
    queryKey: ['agent-activity-latest'],
    queryFn: fetchLatestByAgent,
    staleTime: 60_000,
  });

  useEffect(() => {
    const timersSnapshot = timers.current;
    const channel = supabase
      .channel('agent-activity-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_activity_log' },
        (payload) => {
          const code = (payload.new as { agent_id?: string }).agent_id;
          if (!code) return;
          setWorkingCodes((prev) => new Set(prev).add(code));
          clearTimeout(timersSnapshot[code]);
          timersSnapshot[code] = setTimeout(() => {
            setWorkingCodes((prev) => {
              const next = new Set(prev);
              next.delete(code);
              return next;
            });
          }, WORKING_MS);
          queryClient.invalidateQueries({ queryKey: ['agent-activity-latest'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      Object.values(timersSnapshot).forEach(clearTimeout);
    };
  }, [queryClient]);

  return { lastByAgent, workingCodes, isLoading, error };
}
