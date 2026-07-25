import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Stethoscope, AlertCircle } from 'lucide-react';

interface AthleteMedicalSectionProps {
  sessionCounts: {
    physiotherapy: number;
    psychology: number;
    medical: number;
    total: number;
  };
  injuries?: string | null;
  year: number;
  month?: number;
}

const AthleteMedicalSection: React.FC<AthleteMedicalSectionProps> = ({
  sessionCounts,
  injuries,
  year,
  month
}) => {
  const periodLabel = month !== undefined 
    ? `${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month]} ${year}`
    : String(year);

  const cards = [
    {
      title: 'Fisioterapia',
      value: sessionCounts.physiotherapy,
      icon: Heart,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    {
      title: 'Psicología',
      value: sessionCounts.psychology,
      icon: Brain,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10'
    },
    {
      title: 'Seguimiento Médico',
      value: sessionCounts.medical,
      icon: Stethoscope,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  // Parse injuries if present
  const activeInjuries = injuries?.split(',').map(i => i.trim()).filter(Boolean) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Control Médico y Apoyo</CardTitle>
          <Badge variant="outline">{periodLabel}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card"
            >
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Injuries Section */}
        {activeInjuries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-medium text-muted-foreground">Lesiones Registradas</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeInjuries.map((injury, idx) => (
                <Badge key={idx} variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  {injury}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AthleteMedicalSection;
