import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Target, Heart, Sparkles } from 'lucide-react';

interface AthleteProfileSummaryProps {
  bio?: string | null;
  personalValues?: string | null;
  shortTermGoals?: string | null;
  longTermGoals?: string | null;
}

const AthleteProfileSummary: React.FC<AthleteProfileSummaryProps> = ({
  bio,
  personalValues,
  shortTermGoals,
  longTermGoals
}) => {
  const sections = [
    {
      title: 'Biografía',
      content: bio,
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Valores Personales',
      content: personalValues,
      icon: Heart,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    {
      title: 'Metas a Corto Plazo',
      content: shortTermGoals,
      icon: Target,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Metas a Largo Plazo',
      content: longTermGoals,
      icon: Sparkles,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const activeSections = sections.filter(s => s.content);

  if (activeSections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Perfil Deportivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Completa tu perfil deportivo para mostrar tu biografía, valores y metas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Perfil Deportivo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSections.map((section) => (
            <div
              key={section.title}
              className="p-4 rounded-lg border border-border/50 bg-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-full ${section.bgColor}`}>
                  <section.icon className={`h-4 w-4 ${section.color}`} />
                </div>
                <h4 className="font-medium text-sm">{section.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AthleteProfileSummary;
