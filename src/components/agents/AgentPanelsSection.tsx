import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardAgentPanel } from './DashboardAgentPanel';
import { AGENT_PRESETS } from './agentCatalog';
import type { AgentId } from '@/hooks/useAgentChat';

interface AgentPanelsSectionProps {
  /** Agentes a mostrar; cada uno usa su preset del catálogo */
  agents: AgentId[];
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Renderiza una sección con una grilla de paneles de chat de agentes IA
 * a partir de una lista de `AgentId`. Los datos de cada panel (título, color,
 * preguntas) se toman del catálogo central `AGENT_PRESETS`.
 */
export function AgentPanelsSection({
  agents,
  title = 'Asistentes IA',
  description,
  className,
}: AgentPanelsSectionProps) {
  if (agents.length === 0) return null;

  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
          <Sparkles className="h-4 w-4 text-amber-400" />
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((id) => {
          const preset = AGENT_PRESETS[id];
          return (
            <DashboardAgentPanel
              key={id}
              agentId={id}
              title={preset.title}
              subtitle={preset.subtitle}
              accentColor={preset.accentColor}
              suggestedQuestions={preset.suggestedQuestions}
            />
          );
        })}
      </div>
    </section>
  );
}
