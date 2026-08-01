import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target, 
  Award,
  Activity,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useTrainingKPIs } from '@/hooks/useTrainingKPIs';
import { useUserProfile } from '@/hooks/useUserProfile';

const TRAINING_TYPE_LABELS = {
  technical: 'Técnico',
  physical: 'Físico', 
  mental: 'Mental',
  recovery: 'Recuperación',
  gym: 'Gimnasio',
  road_skating: 'Patinaje en Ruta',
  track_skating: 'Patinaje en Pista',
  bicycle: 'Bicicleta',
  static_bicycle: 'Bicicleta Estática',
  simulator: 'Simulador',
};

const TRAINING_TYPE_COLORS = {
  technical: 'bg-blue-500',
  physical: 'bg-green-500',
  mental: 'bg-purple-500',
  recovery: 'bg-orange-500',
  gym: 'bg-red-500',
  road_skating: 'bg-cyan-500',
  track_skating: 'bg-indigo-500',
  bicycle: 'bg-yellow-500',
  static_bicycle: 'bg-amber-500',
  simulator: 'bg-pink-500',
};

export const KPIDashboard: React.FC = () => {
  const { profile } = useUserProfile();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  
  const { myKPIs, teamStats, athletePerformance, trainingTypeDistribution, isLoading } = useTrainingKPIs(selectedMonth);

  const renderCoachDashboard = () => (
    <div className="grid gap-6">
      {/* Key KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Asistencia del Equipo</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{teamStats?.attendance_rate.toFixed(1) ?? 0}%</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Horas Totales</p>
                <p className="text-2xl font-bold">
                  {myKPIs?.reduce((sum, kpi) => sum + kpi.total_hours, 0).toFixed(1) ?? 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rendimiento Promedio</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{teamStats?.avg_performance_rating?.toFixed(1) || '-'}</p>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sesiones Totales</p>
                <p className="text-2xl font-bold">{teamStats?.total_sessions ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución por Tipo de Entrenamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingTypeDistribution?.map((dist) => (
                <div key={dist.training_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {TRAINING_TYPE_LABELS[dist.training_type as keyof typeof TRAINING_TYPE_LABELS]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {dist.total_hours.toFixed(1)}h ({dist.session_count} sesiones)
                    </span>
                  </div>
                  <Progress 
                    value={dist.attendance_rate} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Asistencia: {dist.attendance_rate.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Athletes Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rendimiento de Atletas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {athletePerformance?.slice(0, 5).map((athlete, index) => (
                <div key={athlete.athlete_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{athlete.athlete_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {athlete.total_hours.toFixed(1)}h entrenadas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{athlete.attendance_percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">asistencia</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAthleteDashboard = () => {
    const myStats = myKPIs?.[0];
    
    return (
      <div className="grid gap-6">
        {/* Personal KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mi Asistencia</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">{myStats?.attendance_percentage.toFixed(1) ?? 0}%</p>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horas Entrenadas</p>
                  <p className="text-2xl font-bold">{myStats?.total_hours.toFixed(1) ?? 0}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progreso Mensual</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">+12%</p>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Training Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Mi Distribución de Entrenamientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(myStats?.training_type_distribution || {}).map(([type, hours]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {TRAINING_TYPE_LABELS[type as keyof typeof TRAINING_TYPE_LABELS]}
                    </span>
                    <span className="text-sm text-muted-foreground">{hours}h</span>
                  </div>
                  <div className={`h-2 rounded-full ${TRAINING_TYPE_COLORS[type as keyof typeof TRAINING_TYPE_COLORS]}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAdminDashboard = () => (
    <div className="grid gap-6">
      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sesiones Registradas</p>
                <p className="text-2xl font-bold">{teamStats?.total_sessions ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cumplimiento Asistencia</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{teamStats?.attendance_rate.toFixed(1) ?? 0}%</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uso Tipos Entrenamiento</p>
                <p className="text-2xl font-bold">{trainingTypeDistribution?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Horas Globales</p>
                <p className="text-2xl font-bold">
                  {trainingTypeDistribution?.reduce((sum, dist) => sum + dist.total_hours, 0).toFixed(1) ?? 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Coach and Admin Views */}
      {renderCoachDashboard()}
    </div>
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando KPIs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Entrenamientos</h2>
          <p className="text-muted-foreground">
            Métricas y KPIs de rendimiento y asistencia
          </p>
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = date.toISOString().slice(0, 7);
              return (
                <SelectItem key={value} value={value}>
                  {format(date, 'MMMM yyyy', { locale: es })}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Role-based dashboard */}
      {profile?.role === 'athlete' && renderAthleteDashboard()}
      {profile?.role === 'coach' && renderCoachDashboard()}
      {['admin', 'leader'].includes(profile?.role ?? '') && renderAdminDashboard()}
      {profile?.role === 'delegate' && renderCoachDashboard()}
    </div>
  );
};