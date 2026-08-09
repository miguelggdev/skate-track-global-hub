import type { AgentId } from '@/hooks/useAgentChat';

/**
 * Metadatos de presentación para la galería en vivo: código AG-XX (para cruzar
 * con `agent_activity_log.agent_id`) y un emoji-avatar por agente.
 */
export interface AgentMeta {
  agCode: string;
  emoji: string;
}

export const AGENT_META: Record<AgentId, AgentMeta> = {
  admin:      { agCode: 'AG-01', emoji: '🗂️' },
  skating:    { agCode: 'AG-02', emoji: '🛼' },
  cycling:    { agCode: 'AG-03', emoji: '🚴' },
  nutrition:  { agCode: 'AG-04', emoji: '🥗' },
  gym:        { agCode: 'AG-05', emoji: '🏋️' },
  medical:    { agCode: 'AG-06', emoji: '🩺' },
  finance:    { agCode: 'AG-07', emoji: '💰' },
  security:   { agCode: 'AG-08', emoji: '🛡️' },
  marketing:  { agCode: 'AG-09', emoji: '📣' },
  results:    { agCode: 'AG-10', emoji: '🏆' },
  operations: { agCode: 'AG-11', emoji: '⚙️' },
  legal:      { agCode: 'AG-12', emoji: '⚖️' },
  psychology: { agCode: 'AG-13', emoji: '🧠' },
};

/** Reverse lookup: 'AG-07' → 'finance' */
export const AG_CODE_TO_ID: Record<string, AgentId> = Object.fromEntries(
  (Object.entries(AGENT_META) as [AgentId, AgentMeta][]).map(([id, m]) => [m.agCode, id]),
) as Record<string, AgentId>;
