import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Users, Trophy, DollarSign, Calendar, CheckCircle2, XCircle,
  Clock, AlertCircle, Medal, ChevronRight, Baby, HeartPulse, MessageSquare,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ── Types ────────────────────────────────────────────────────────────────────

interface LinkedAthlete {
  id: string;
  first_name: string;
  last_name: string;
  category: string;
  status: string;
  performance_score: number;
  photo_url: string | null;
  date_of_birth: string | null;
}

interface AttendanceRecord {
  id: string;
  status: string;
  recorded_at: string;
  training_sessions: { title: string; scheduled_at: string } | null;
}

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  due_date: string | null;
  notes: string | null;
}

interface Competition {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  category: string | null;
}

interface Award {
  id: string;
  title: string;
  medal_type: string | null;
  award_date: string;
  competitions: { name: string } | null;
}

interface MedicalRestriction {
  id: string;
  session_type: string;
  status: string;
  diagnosis: string | null;
  follow_up_date: string | null;
  session_date: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  escuela: 'Escuela', menores: 'Menores', transicion: 'Transición',
  prejuvenil: 'Prejuvenil', juvenil: 'Juvenil', mayores: 'Mayores',
  preclub: 'Preclub', adultos: 'Adultos',
};

const MEDAL_EMOJI: Record<string, string> = {
  gold: '🥇', oro: '🥇', silver: '🥈', plata: '🥈',
  bronze: '🥉', bronce: '🥉', special: '🏅',
};

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function statusColor(status: string) {
  switch (status) {
    case 'present':  return 'text-green-500';
    case 'absent':   return 'text-red-500';
    case 'late':     return 'text-amber-500';
    case 'excused':  return 'text-blue-500';
    default:         return 'text-muted-foreground';
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'present':  return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'absent':   return <XCircle className="h-4 w-4 text-red-500" />;
    case 'late':     return <Clock className="h-4 w-4 text-amber-500" />;
    case 'excused':  return <AlertCircle className="h-4 w-4 text-blue-500" />;
    default:         return null;
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    present: 'Asistió', absent: 'Faltó', late: 'Tardanza', excused: 'Justificado',
  };
  return map[status] ?? status;
}

function txStatusBadge(status: string) {
  switch (status) {
    case 'pending': return <Badge variant="secondary" className="text-amber-600 bg-amber-100 dark:bg-amber-950">Pendiente</Badge>;
    case 'overdue': return <Badge variant="destructive">Vencido</Badge>;
    case 'paid':    return <Badge className="bg-green-100 text-green-700 dark:bg-green-950">Pagado</Badge>;
    default:        return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  // 1. Fetch linked athletes
  const { data: linkedAthletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ['parent-athletes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      type ParentAthleteRow = { athlete_id: string };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linksRes = await (supabase as any)
        .from('parent_athletes')
        .select('athlete_id')
        .eq('parent_user_id', user.id) as { data: ParentAthleteRow[] | null; error: { message: string } | null };

      if (linksRes.error) throw new Error(linksRes.error.message);
      const links = linksRes.data;
      if (!links || links.length === 0) return [];

      const ids = links.map(l => l.athlete_id);
      const { data: athletes } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, status, performance_score, photo_url, date_of_birth')
        .in('id', ids);

      return (athletes ?? []) as LinkedAthlete[];
    },
    enabled: !!user,
  });

  // Auto-select first athlete
  const activeAthleteId = selectedAthleteId ?? linkedAthletes[0]?.id ?? null;
  const activeAthlete = linkedAthletes.find(a => a.id === activeAthleteId) ?? null;

  // 2. Attendance (last 30 sessions)
  const { data: attendance = [] } = useQuery({
    queryKey: ['parent-attendance', activeAthleteId],
    queryFn: async () => {
      if (!activeAthleteId) return [];
      const { data } = await supabase
        .from('attendance')
        .select('id, status, recorded_at, training_sessions(title, scheduled_at)')
        .eq('athlete_id', activeAthleteId)
        .order('recorded_at', { ascending: false })
        .limit(30);
      return (data ?? []) as AttendanceRecord[];
    },
    enabled: !!activeAthleteId,
  });

  // 3. Pending/overdue transactions
  const { data: pendingTx = [] } = useQuery({
    queryKey: ['parent-transactions', activeAthleteId],
    queryFn: async () => {
      if (!activeAthleteId) return [];
      const { data } = await supabase
        .from('transactions')
        .select('id, type, status, amount, due_date, notes')
        .eq('athlete_id', activeAthleteId)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });
      return (data ?? []) as Transaction[];
    },
    enabled: !!activeAthleteId,
  });

  // 4. Upcoming competitions
  const { data: upcomingComps = [] } = useQuery({
    queryKey: ['parent-competitions', activeAthlete?.category],
    queryFn: async () => {
      if (!activeAthlete) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('competitions')
        .select('id, name, location, start_date, end_date, category')
        .gte('start_date', today)
        .or(`category.is.null,category.eq.${activeAthlete.category}`)
        .order('start_date', { ascending: true })
        .limit(5);
      return (data ?? []) as Competition[];
    },
    enabled: !!activeAthlete,
  });

  // 5. Recent awards
  const { data: recentAwards = [] } = useQuery({
    queryKey: ['parent-awards', activeAthleteId],
    queryFn: async () => {
      if (!activeAthleteId) return [];
      const { data } = await supabase
        .from('awards')
        .select('id, title, medal_type, award_date, competitions(name)')
        .eq('athlete_id', activeAthleteId)
        .order('award_date', { ascending: false })
        .limit(5);
      return (data ?? []) as Award[];
    },
    enabled: !!activeAthleteId,
  });

  // 6. Medical restrictions for linked athlete
  const { data: medicalRestrictions = [] } = useQuery({
    queryKey: ['parent-medical', activeAthleteId],
    queryFn: async () => {
      if (!activeAthleteId) return [];
      const { data } = await supabase
        .from('medical_sessions')
        .select('id, session_type, status, diagnosis, follow_up_date, session_date')
        .eq('athlete_id', activeAthleteId)
        .in('status', ['active_restriction', 'partial_restriction', 'scheduled'])
        .order('session_date', { ascending: false });
      return (data ?? []) as MedicalRestriction[];
    },
    enabled: !!activeAthleteId,
  });

  // Computed attendance stats
  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Portal de Padres" userRole="parent">
      <div className="space-y-4 md:space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Bienvenido/a, {profile?.first_name || 'Padre/Tutor'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Panel de seguimiento de tu deportista
          </p>
        </div>

        {/* No athletes linked */}
        {!loadingAthletes && linkedAthletes.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Baby className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sin deportistas vinculados</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  El administrador del club debe vincular tu cuenta con el perfil de tu hijo/a.
                  Contacta al club para que realicen la vinculación.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Athlete selector (multiple children) */}
        {linkedAthletes.length > 1 && (
          <div className="flex gap-3 flex-wrap">
            {linkedAthletes.map(a => (
              <Button
                key={a.id}
                variant={activeAthleteId === a.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAthleteId(a.id)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                {a.first_name} {a.last_name}
              </Button>
            ))}
          </div>
        )}

        {activeAthlete && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* ── Left column ─────────────────────────────────────── */}
            <div className="lg:col-span-1 space-y-6">

              {/* Athlete Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Mi deportista
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-20 w-20">
                    {activeAthlete.photo_url && (
                      <AvatarImage src={activeAthlete.photo_url} alt={activeAthlete.first_name} />
                    )}
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {initials(activeAthlete.first_name, activeAthlete.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {activeAthlete.first_name} {activeAthlete.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORY_LABEL[activeAthlete.category] ?? activeAthlete.category}
                    </p>
                    {activeAthlete.date_of_birth && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(activeAthlete.date_of_birth), "d 'de' MMMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={activeAthlete.status === 'active' ? 'default' : 'secondary'}>
                      {activeAthlete.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {activeAthlete.performance_score > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        {activeAthlete.performance_score} pts
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Attendance summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Asistencia reciente
                  </CardTitle>
                  {attendanceRate !== null && (
                    <CardDescription>
                      {attendanceRate}% en las últimas {attendance.length} sesiones
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Rate bar */}
                  {attendanceRate !== null && (
                    <div className="mb-4">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${attendanceRate}%`,
                            backgroundColor: attendanceRate >= 80 ? '#10b981' : attendanceRate >= 60 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {attendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin registros de asistencia
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {attendance.slice(0, 8).map(rec => {
                        const session = rec.training_sessions as AttendanceRecord['training_sessions'];
                        return (
                          <div key={rec.id} className="flex items-center gap-3 py-1">
                            {statusIcon(rec.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {session?.title ?? 'Sesión'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {session?.scheduled_at
                                  ? format(new Date(session.scheduled_at), "d MMM", { locale: es })
                                  : format(new Date(rec.recorded_at), "d MMM", { locale: es })}
                              </p>
                            </div>
                            <span className={`text-xs font-medium ${statusColor(rec.status)}`}>
                              {statusLabel(rec.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Right column ─────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Pending payments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Pagos pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingTx.length === 0 ? (
                    <div className="flex items-center gap-3 py-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm font-medium">Sin pagos pendientes — ¡al día!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {pendingTx.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium capitalize">
                              {tx.type.replace(/_/g, ' ')}
                            </p>
                            {tx.notes && (
                              <p className="text-xs text-muted-foreground">{tx.notes}</p>
                            )}
                            {tx.due_date && (
                              <p className="text-xs text-muted-foreground">
                                Vence: {format(new Date(tx.due_date), "d 'de' MMMM", { locale: es })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {txStatusBadge(tx.status)}
                            <span className="font-semibold text-sm">
                              ${tx.amount.toLocaleString('es-CO')}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 flex justify-between text-sm font-bold">
                        <span>Total pendiente</span>
                        <span className="text-red-600 dark:text-red-400">
                          ${pendingTx.reduce((s, t) => s + t.amount, 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming competitions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Próximas competencias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingComps.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No hay competencias próximas programadas
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingComps.map(comp => (
                        <div
                          key={comp.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-amber-600 leading-none">
                              {format(new Date(comp.start_date), 'd')}
                            </span>
                            <span className="text-[10px] text-amber-600 uppercase">
                              {format(new Date(comp.start_date), 'MMM', { locale: es })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{comp.name}</p>
                            {comp.location && (
                              <p className="text-xs text-muted-foreground truncate">{comp.location}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comp.start_date), { locale: es, addSuffix: true })}
                            </p>
                          </div>
                          {comp.category && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {CATEGORY_LABEL[comp.category] ?? comp.category}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent awards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Medal className="h-4 w-4 text-purple-500" />
                    Logros recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAwards.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Aún no hay logros registrados
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentAwards.map(award => {
                        const emoji = MEDAL_EMOJI[(award.medal_type ?? '').toLowerCase()] ?? '🏅';
                        const comp = award.competitions as Award['competitions'];
                        return (
                          <div key={award.id} className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                            <span className="text-2xl flex-shrink-0">{emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{award.title}</p>
                              {comp?.name && (
                                <p className="text-xs text-muted-foreground">{comp.name}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(award.award_date), "d 'de' MMMM yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical status */}
              <Card className={medicalRestrictions.some(r => r.status === 'active_restriction') ? 'border-red-200' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartPulse className={`h-4 w-4 ${medicalRestrictions.some(r => r.status === 'active_restriction') ? 'text-red-500' : 'text-emerald-500'}`} />
                    Estado médico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {medicalRestrictions.length === 0 ? (
                    <div className="flex items-center gap-2 py-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm font-medium">Apto para entrenar — sin restricciones activas</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {medicalRestrictions.map(r => (
                        <div
                          key={r.id}
                          className={`p-3 rounded-lg border ${
                            r.status === 'active_restriction'
                              ? 'bg-red-500/10 border-red-200'
                              : r.status === 'partial_restriction'
                              ? 'bg-amber-500/10 border-amber-200'
                              : 'bg-blue-500/10 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className={`h-4 w-4 flex-shrink-0 ${
                              r.status === 'active_restriction' ? 'text-red-500' :
                              r.status === 'partial_restriction' ? 'text-amber-500' : 'text-blue-500'
                            }`} />
                            <span className="text-sm font-semibold capitalize">
                              {r.status === 'active_restriction' ? 'Restricción total' :
                               r.status === 'partial_restriction' ? 'Restricción parcial' : 'Consulta programada'}
                            </span>
                          </div>
                          {r.diagnosis && (
                            <p className="text-xs text-muted-foreground">{r.diagnosis}</p>
                          )}
                          {r.follow_up_date && (
                            <p className="text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Seguimiento: {format(new Date(r.follow_up_date), "d 'de' MMMM", { locale: es })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages shortcut */}
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mensajes del club</p>
                      <p className="text-xs text-muted-foreground">Comunícate con el equipo técnico</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/mensajes')}
                    className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                  >
                    Abrir <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
