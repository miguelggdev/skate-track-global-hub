import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, Calendar, HeartPulse, Search, Clock,
  CheckCircle2, Activity, Users, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AthleteMedicalDialog } from '@/components/medical/AthleteMedicalDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AthleteWithMedical {
  id: string;
  first_name: string;
  last_name: string;
  category: string;
  blood_type: string | null;
  allergies: string | null;
  eps: string | null;
  accident_insurance: string | null;
  fractures: string | null;
  surgeries: string | null;
  physical_limitations: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

interface MedicalSession {
  id: string;
  athlete_id: string;
  session_type: string;
  session_date: string;
  status: string;
  follow_up_date: string | null;
  diagnosis: string | null;
  treatment: string | null;
  provider_name: string | null;
  notes: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  escuela:    'Escuela',
  menores:    'Menores',
  transicion: 'Transición',
  prejuvenil: 'Prejuvenil',
  juvenil:    'Juvenil',
  mayores:    'Mayores',
  preclub:    'Preclub',
  adultos:    'Adultos',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

const today = new Date().toISOString().split('T')[0];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MedicalPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AthleteWithMedical | null>(null);

  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ['medical-athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, blood_type, allergies, eps, accident_insurance, fractures, surgeries, physical_limitations, emergency_contact_name, emergency_contact_phone')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return (data ?? []) as AthleteWithMedical[];
    },
  });

  const { data: allSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['medical-all-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_sessions')
        .select('*')
        .order('session_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MedicalSession[];
    },
  });

  // ── KPIs ──
  const sessionsByAthlete = allSessions.reduce<Record<string, MedicalSession[]>>((acc, s) => {
    (acc[s.athlete_id] ??= []).push(s);
    return acc;
  }, {});

  const activeRestrictions = allSessions.filter(
    s => s.status === 'active_restriction' || s.status === 'partial_restriction',
  );
  const uniqueRestricted = new Set(activeRestrictions.map(s => s.athlete_id)).size;

  const upcomingFollowUps = allSessions.filter(
    s => s.follow_up_date && s.follow_up_date >= today,
  );

  const thisMonth = new Date().toISOString().slice(0, 7);
  const sessionsThisMonth = allSessions.filter(s => s.session_date.startsWith(thisMonth)).length;

  const overdueFollowUps = allSessions.filter(
    s => s.follow_up_date && s.follow_up_date < today &&
      (s.status === 'active_restriction' || s.status === 'partial_restriction' || s.status === 'scheduled'),
  );

  // ── Status per athlete ──
  const getAthleteStatus = (athleteId: string): 'restriction' | 'followup' | 'ok' | 'none' => {
    const sessions = sessionsByAthlete[athleteId] ?? [];
    if (sessions.some(s => s.status === 'active_restriction' || s.status === 'partial_restriction')) return 'restriction';
    if (sessions.some(s => s.follow_up_date && s.follow_up_date >= today)) return 'followup';
    if (sessions.length > 0) return 'ok';
    return 'none';
  };

  // ── Filtered athletes ──
  const filtered = athletes.filter(a => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      CATEGORY_LABELS[a.category]?.toLowerCase().includes(q)
    );
  });

  const isLoading = athletesLoading || sessionsLoading;

  return (
    <DashboardLayout title="Médico" userRole="Admin">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-red-500" />
            Módulo Médico
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fichas médicas, sesiones de atención y restricciones de entrenamiento
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Con restricciones</span>
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-500">{uniqueRestricted}</p>
              <p className="text-xs text-muted-foreground mt-1">Atletas con restricción activa</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Seguimientos</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-500">{upcomingFollowUps.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Citas de seguimiento pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Sesiones del mes</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-500">{sessionsThisMonth}</p>
              <p className="text-xs text-muted-foreground mt-1">Atenciones registradas este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Vencidas</span>
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center',
                  overdueFollowUps.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
                )}>
                  <Clock className={cn('h-4 w-4', overdueFollowUps.length > 0 ? 'text-amber-500' : 'text-emerald-500')} />
                </div>
              </div>
              <p className={cn('text-2xl font-black', overdueFollowUps.length > 0 ? 'text-amber-500' : 'text-emerald-500')}>
                {overdueFollowUps.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Seguimientos vencidos sin cerrar</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts — overdue follow-ups */}
        {overdueFollowUps.length > 0 && (
          <Card className="border-amber-300/40 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {overdueFollowUps.length} seguimiento{overdueFollowUps.length !== 1 ? 's' : ''} vencido{overdueFollowUps.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hay citas de seguimiento cuya fecha ya pasó y la restricción/sesión sigue abierta.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {overdueFollowUps.slice(0, 5).map(s => {
                      const a = athletes.find(at => at.id === s.athlete_id);
                      if (!a) return null;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelected(a)}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
                        >
                          {a.first_name} {a.last_name} · {formatDate(s.follow_up_date!)}
                        </button>
                      );
                    })}
                    {overdueFollowUps.length > 5 && (
                      <span className="text-[11px] text-muted-foreground">+{overdueFollowUps.length - 5} más</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Athletes table */}
        <Card>
          <CardContent className="p-0">
            {/* Search bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-8 text-sm"
                  placeholder="Buscar atleta…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {filtered.length} de {athletes.length} atleta{athletes.length !== 1 ? 's' : ''}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <Users className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'No se encontraron atletas con esa búsqueda' : 'Sin atletas activos'}
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Atleta</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Categoría</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Estado médico</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 hidden md:table-cell">Sesiones</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 hidden lg:table-cell">Próximo seguimiento</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(athlete => {
                      const status = getAthleteStatus(athlete.id);
                      const sessions = sessionsByAthlete[athlete.id] ?? [];
                      const nextFollowUp = sessions
                        .filter(s => s.follow_up_date && s.follow_up_date >= today)
                        .sort((a, b) => (a.follow_up_date! < b.follow_up_date! ? -1 : 1))[0];

                      return (
                        <tr
                          key={athlete.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelected(athlete)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                                status === 'restriction' ? 'bg-red-500' :
                                status === 'followup'   ? 'bg-blue-500' :
                                status === 'ok'         ? 'bg-emerald-500' :
                                'bg-muted-foreground/40',
                              )}>
                                {athlete.first_name[0]}{athlete.last_name[0]}
                              </div>
                              <span className="font-medium">
                                {athlete.first_name} {athlete.last_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {CATEGORY_LABELS[athlete.category] ?? athlete.category}
                          </td>
                          <td className="px-4 py-3">
                            {status === 'restriction' && (
                              <Badge className="gap-1 bg-red-500/15 text-red-600 border-red-200 border text-[10px]">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Restricción activa
                              </Badge>
                            )}
                            {status === 'followup' && (
                              <Badge className="gap-1 bg-blue-500/15 text-blue-600 border-blue-200 border text-[10px]">
                                <Clock className="h-2.5 w-2.5" />
                                Seguimiento pendiente
                              </Badge>
                            )}
                            {status === 'ok' && (
                              <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-200 border text-[10px]">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Apto
                              </Badge>
                            )}
                            {status === 'none' && (
                              <span className="text-xs text-muted-foreground">Sin registro</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {sessions.length > 0 ? sessions.length : <span className="text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {nextFollowUp?.follow_up_date ? (
                              <span className="text-xs text-blue-600">{formatDate(nextFollowUp.follow_up_date)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <AthleteMedicalDialog
        athlete={selected}
        onClose={() => setSelected(null)}
      />
    </DashboardLayout>
  );
}
