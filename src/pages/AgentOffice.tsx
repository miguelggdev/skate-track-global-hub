import DashboardLayout from '@/components/layout/DashboardLayout';
import { AgentOfficeScene } from '@/components/agents/AgentOfficeScene';
import { useAgentActivity } from '@/hooks/useAgentActivity';

const AgentOffice = () => {
  const { workingCodes } = useAgentActivity();
  return (
    <DashboardLayout title="Oficina de agentes IA">
      <div className="space-y-6 max-w-none">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Oficina de agentes IA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Los 13 asistentes de IA “trabajando” en su oficina. Cuando un agente ejecuta una
            automatización real, su personaje se pone a trabajar en la escena.
          </p>
        </div>
        <AgentOfficeScene activeCodes={Array.from(workingCodes)} />
      </div>
    </DashboardLayout>
  );
};

export default AgentOffice;
