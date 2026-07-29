import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ClipboardList, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Evaluation } from '@/hooks/useEvaluations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  completed: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  reviewed:  'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', completed: 'Completada', reviewed: 'Revisada',
};

const TYPE_LABEL: Record<string, string> = {
  integral:    'Integral',
  fisica:      'Física',
  tecnica:     'Técnica',
  seguimiento: 'Seguimiento',
  semestral:   'Semestral',
  anual:       'Anual',
};

function ScoreBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  const color = value >= 8 ? 'text-green-600 dark:text-green-400'
    : value >= 6 ? 'text-blue-600 dark:text-blue-400'
    : value >= 4 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-500';
  return <span className={cn('font-bold tabular-nums text-sm', color)}>{value.toFixed(1)}</span>;
}

function TrendIcon({ current, previous }: { current: number | null; previous: number | null }) {
  if (current == null || previous == null) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  const delta = current - previous;
  if (delta > 0.1) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (delta < -0.1) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  evaluations: Evaluation[];
}

export function EvaluationHistoryTable({ evaluations }: Props) {
  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <ClipboardList className="h-14 w-14 text-muted-foreground/30" />
          <p className="text-muted-foreground">Sin evaluaciones registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Veloc.</TableHead>
                <TableHead className="text-center">Técnica</TableHead>
                <TableHead className="text-center">Fuerza</TableHead>
                <TableHead className="text-center">Resist.</TableHead>
                <TableHead className="text-center">General</TableHead>
                <TableHead className="text-center">Tend.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Próx. eval.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((ev, i) => {
                const prev = evaluations[i + 1];
                return (
                  <TableRow key={ev.id} className={i === 0 ? 'bg-orange-500/5' : ''}>
                    <TableCell className="font-medium text-sm whitespace-nowrap">
                      {ev.evaluation_date.slice(0, 10)}
                      {i === 0 && (
                        <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0 border-orange-500/40 text-orange-500">
                          Última
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {TYPE_LABEL[ev.evaluation_type] ?? ev.evaluation_type}
                    </TableCell>
                    <TableCell className="text-center"><ScoreBadge value={ev.speed_score} /></TableCell>
                    <TableCell className="text-center"><ScoreBadge value={ev.technique_score} /></TableCell>
                    <TableCell className="text-center"><ScoreBadge value={ev.strength_score} /></TableCell>
                    <TableCell className="text-center"><ScoreBadge value={ev.endurance_score} /></TableCell>
                    <TableCell className="text-center"><ScoreBadge value={ev.overall_score} /></TableCell>
                    <TableCell className="text-center">
                      <TrendIcon current={ev.overall_score} previous={prev?.overall_score ?? null} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', STATUS_STYLE[ev.status])}>
                        {STATUS_LABEL[ev.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {ev.next_eval_date?.slice(0, 10) ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Notes panel for latest evaluation */}
        {evaluations[0]?.coach_notes && (
          <div className="border-t px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notas del entrenador (última eval.)</p>
            <p className="text-sm text-foreground">{evaluations[0].coach_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
