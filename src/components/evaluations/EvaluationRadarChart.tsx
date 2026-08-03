import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Evaluation } from '@/hooks/useEvaluations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RadarDataPoint {
  dimension: string;
  current: number;
  anterior: number;
}

function buildRadarData(current: Evaluation, previous?: Evaluation): RadarDataPoint[] {
  return [
    { dimension: 'Velocidad',   current: current.speed_score ?? 0,     anterior: previous?.speed_score ?? 0 },
    { dimension: 'Técnica',     current: current.technique_score ?? 0,  anterior: previous?.technique_score ?? 0 },
    { dimension: 'Fuerza',      current: current.strength_score ?? 0,   anterior: previous?.strength_score ?? 0 },
    { dimension: 'Resistencia', current: current.endurance_score ?? 0,  anterior: previous?.endurance_score ?? 0 },
    { dimension: 'General',     current: current.overall_score ?? 0,    anterior: previous?.overall_score ?? 0 },
  ];
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiBox({ label, value, delta, unit = '' }: {
  label: string; value: string | number; delta?: number; unit?: string;
}) {
  const isUp = delta !== undefined && delta > 0;
  const isDown = delta !== undefined && delta < 0;

  return (
    <div className="bg-muted/40 rounded-xl px-4 py-3 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-black text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
        {delta !== undefined && (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-semibold mb-0.5 ml-1',
            isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value.toFixed(1)}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  evaluations: Evaluation[];
}

export function EvaluationRadarChart({ evaluations }: Props) {
  const current = evaluations[0];
  const previous = evaluations[1];

  if (!current) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <Activity className="h-14 w-14 text-muted-foreground/30" />
          <p className="text-muted-foreground">Sin evaluaciones registradas aún</p>
        </CardContent>
      </Card>
    );
  }

  const radarData = buildRadarData(current, previous);
  const overallDelta = previous?.overall_score != null
    ? (current.overall_score ?? 0) - previous.overall_score
    : undefined;
  const daysToNext = current.next_eval_date
    ? Math.ceil((new Date(current.next_eval_date).getTime() - Date.now()) / 86_400_000)
    : null;

  const statusColor: Record<string, string> = {
    pending:   'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    completed: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    reviewed:  'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  };
  const statusLabel: Record<string, string> = {
    pending: 'Pendiente', completed: 'Completada', reviewed: 'Revisada',
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiBox
          label="Score General"
          value={(current.overall_score ?? 0).toFixed(1)}
          delta={overallDelta}
          unit="/ 10"
        />
        <KpiBox
          label="Velocidad"
          value={(current.speed_score ?? 0).toFixed(1)}
          delta={previous?.speed_score != null ? (current.speed_score ?? 0) - previous.speed_score : undefined}
          unit="/ 10"
        />
        <KpiBox
          label="Técnica"
          value={(current.technique_score ?? 0).toFixed(1)}
          delta={previous?.technique_score != null ? (current.technique_score ?? 0) - previous.technique_score : undefined}
          unit="/ 10"
        />
        <KpiBox
          label={daysToNext !== null ? (daysToNext > 0 ? `Próx. eval en ${daysToNext}d` : 'Eval. vencida') : 'Próx. evaluación'}
          value={current.next_eval_date ? current.next_eval_date.slice(0, 10) : '—'}
        />
      </div>

      {/* Chart card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Perfil de Rendimiento
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', statusColor[current.status])}>
                {statusLabel[current.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">{current.evaluation_date.slice(0, 10)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData} margin={{ top: 16, right: 40, left: 40, bottom: 16 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {previous && (
                <Radar
                  name="Anterior"
                  dataKey="anterior"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.12}
                  strokeDasharray="4 2"
                  strokeWidth={1.5}
                />
              )}
              <Radar
                name="Actual"
                dataKey="current"
                stroke="#ea580c"
                fill="#ea580c"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ r: 3, fill: '#ea580c' }}
              />
              {previous && <Legend wrapperStyle={{ fontSize: 12 }} />}
            </RadarChart>
          </ResponsiveContainer>

          {/* Textual insights */}
          {(current.strengths || current.areas_to_improve || current.goals) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {current.strengths && (
                <div className="bg-green-500/8 rounded-lg p-3 border border-green-500/20">
                  <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Fortalezas</p>
                  <p className="text-muted-foreground">{current.strengths}</p>
                </div>
              )}
              {current.areas_to_improve && (
                <div className="bg-amber-500/8 rounded-lg p-3 border border-amber-500/20">
                  <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">A mejorar</p>
                  <p className="text-muted-foreground">{current.areas_to_improve}</p>
                </div>
              )}
              {current.goals && (
                <div className="bg-blue-500/8 rounded-lg p-3 border border-blue-500/20">
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Metas</p>
                  <p className="text-muted-foreground">{current.goals}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
