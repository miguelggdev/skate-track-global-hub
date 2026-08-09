import DashboardLayout from '@/components/layout/DashboardLayout';
import { AgentsGallery } from '@/components/agents/AgentsGallery';

const AgentsLive = () => {
  return (
    <DashboardLayout title="Agentes IA en vivo">
      <div className="space-y-6 max-w-none">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agentes IA en vivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Los 13 asistentes de IA del club y su actividad en tiempo real. Cuando un agente
            ejecuta una automatización, su tarjeta se anima como “trabajando”.
          </p>
        </div>
        <AgentsGallery />
      </div>
    </DashboardLayout>
  );
};

export default AgentsLive;
