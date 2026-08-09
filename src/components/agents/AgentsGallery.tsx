import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AGENT_PRESETS } from './agentCatalog';
import { AGENT_META } from './agentMeta';
import type { AgentId } from '@/hooks/useAgentChat';
import { useAgentActivity, type AgentActivity } from '@/hooks/useAgentActivity';

const AGENTS = (Object.keys(AGENT_META) as AgentId[]).sort((a, b) =>
  AGENT_META[a].agCode.localeCompare(AGENT_META[b].agCode),
);

function relTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

interface CardProps {
  id: AgentId;
  working: boolean;
  activity?: AgentActivity;
}

function AgentCard({ id, working, activity }: CardProps) {
  const preset = AGENT_PRESETS[id];
  const meta = AGENT_META[id];

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Card className="relative overflow-hidden border-border">
        {/* Aura animada — respira en idle, se intensifica al trabajar */}
        <motion.div
          aria-hidden
          className={cn('absolute inset-0 bg-gradient-to-br', preset.accentColor)}
          animate={{ opacity: working ? [0.18, 0.42, 0.18] : [0.05, 0.11, 0.05] }}
          transition={{ duration: working ? 1.2 : 3.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative p-4 flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {working && (
              <motion.span
                aria-hidden
                className={cn('absolute inset-0 rounded-xl bg-gradient-to-br', preset.accentColor)}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <motion.div
              className={cn(
                'relative w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                preset.accentColor,
              )}
              animate={working ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-2xl leading-none">{meta.emoji}</span>
            </motion.div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{preset.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground truncate">{preset.subtitle}</p>

            {/* Estado */}
            <div className="mt-2 h-5 flex items-center text-xs">
              <AnimatePresence mode="wait" initial={false}>
                {working ? (
                  <motion.span
                    key="working"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="inline-flex items-center gap-1.5 font-medium text-emerald-500"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Trabajando…
                  </motion.span>
                ) : activity ? (
                  <motion.span
                    key="last"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-flex items-center gap-1.5 text-muted-foreground"
                  >
                    {activity.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    {activity.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    {activity.status === 'skipped' && <MinusCircle className="h-3.5 w-3.5 text-amber-500" />}
                    {relTime(activity.ran_at)}
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground/70">
                    Sin actividad reciente
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Código AG */}
          <span className="relative text-[10px] font-mono text-muted-foreground/60">{meta.agCode}</span>
        </div>
      </Card>
    </motion.div>
  );
}

export function AgentsGallery() {
  const { lastByAgent, workingCodes } = useAgentActivity();
  const workingCount = workingCodes.size;

  return (
    <div className="space-y-4">
      {/* Leyenda / contador */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {workingCount > 0 ? `${workingCount} trabajando ahora` : '13 agentes en línea'}
        </span>
        <span>• La actividad se actualiza en vivo</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {AGENTS.map((id) => (
          <AgentCard
            key={id}
            id={id}
            working={workingCodes.has(AGENT_META[id].agCode)}
            activity={lastByAgent[AGENT_META[id].agCode]}
          />
        ))}
      </div>
    </div>
  );
}
