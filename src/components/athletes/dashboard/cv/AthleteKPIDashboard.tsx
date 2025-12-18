import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Clock, Trophy, TrendingUp, Bike, Dumbbell } from 'lucide-react';
import { SkatingHelmetIcon } from '@/components/athletes/SkatingHelmetIcon';

interface AthleteKPIDashboardProps {
  totalSessions: number;
  totalHours: number;
  sessionsByType: {
    pista: number;
    ruta: number;
    gym: number;
    other: number;
  };
  avgSessionsPerWeek: number;
  competitionCount: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  dateFilter: { year: number; month?: number };
  onFilterChange: (filter: { year: number; month?: number }) => void;
}

const AthleteKPIDashboard: React.FC<AthleteKPIDashboardProps> = ({
  totalSessions,
  totalHours,
  sessionsByType,
  avgSessionsPerWeek,
  competitionCount,
  medals,
  dateFilter,
  onFilterChange
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 'all', label: 'Todo el año' },
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' }
  ];

  const kpiCards = [
    {
      title: 'Total Entrenamientos',
      value: totalSessions,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Horas Totales',
      value: `${totalHours}h`,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Patinaje Pista',
      value: sessionsByType.pista,
      icon: SkatingHelmetIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Patinaje Ruta',
      value: sessionsByType.ruta,
      icon: Bike,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Gimnasio',
      value: sessionsByType.gym,
      icon: Dumbbell,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Promedio Semanal',
      value: avgSessionsPerWeek,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10'
    },
    {
      title: 'Competencias',
      value: competitionCount,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Indicadores de Rendimiento</CardTitle>
          
          <div className="flex gap-2">
            <Select
              value={String(dateFilter.year)}
              onValueChange={(v) => onFilterChange({ ...dateFilter, year: Number(v) })}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={dateFilter.month !== undefined ? String(dateFilter.month) : 'all'}
              onValueChange={(v) => onFilterChange({ 
                ...dateFilter, 
                month: v === 'all' ? undefined : Number(v) 
              })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.title}
              className="flex flex-col items-center p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className={`p-2 rounded-full ${kpi.bgColor} mb-2`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
              <span className="text-xs text-muted-foreground text-center mt-1">{kpi.title}</span>
            </div>
          ))}
        </div>

        {/* Medals Summary */}
        {(medals.gold > 0 || medals.silver > 0 || medals.bronze > 0) && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Medallas</h4>
            <div className="flex gap-4">
              {medals.gold > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🥇</span>
                  <span className="font-semibold">{medals.gold}</span>
                </div>
              )}
              {medals.silver > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🥈</span>
                  <span className="font-semibold">{medals.silver}</span>
                </div>
              )}
              {medals.bronze > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🥉</span>
                  <span className="font-semibold">{medals.bronze}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AthleteKPIDashboard;
