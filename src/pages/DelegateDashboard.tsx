import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  DelegateResultsBar, DelegateMedalsPie, DelegateInscriptionsBar
} from '@/components/dashboard/DelegateCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, CreditCard, Trophy, TrendingUp, Gift, AlertCircle, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { useDelegateStats } from '@/hooks/useDelegateStats';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DelegateDashboard = () => {
  const { currency } = useCurrency();
  const { data: stats, isLoading } = useDelegateStats();
  const navigate = useNavigate();

  const categoryLabels: Record<string, string> = {
    escuela: 'Escuela',
    menores: 'Menores',
    transicion: 'Transición',
    prejuvenil: 'Pre-Juvenil',
    juvenil: 'Juvenil',
    mayores: 'Mayores',
    youth: 'Youth',
    junior: 'Junior',
    senior: 'Senior',
    masters: 'Masters',
  };

  return (
    <DashboardLayout title="Panel del Delegado" userRole="delegate">
      <div className="space-y-6">
        {/* KPIs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/delegate/athletes')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Atletas</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalAthletes ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Deportistas activos</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/delegate/competitions')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Competencias</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.upcomingCompetitions ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Eventos programados</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/delegate/payments')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <CreditCard className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.pendingPayments ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats?.pendingPaymentsAmount ?? 0, currency)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/delegate/payments')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Completados</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats?.completedPaymentsAmount ?? 0, currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total recaudado</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DelegateResultsBar />
          <DelegateMedalsPie />
        </div>
        <DelegateInscriptionsBar />

        {/* Quick Actions and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              <CardDescription>Operaciones frecuentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/delegate/athletes')}
              >
                <Users className="mr-2 h-4 w-4" />
                Ver Atletas
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/delegate/competitions')}
              >
                <Trophy className="mr-2 h-4 w-4" />
                Gestionar Competencias
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/delegate/payments')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Registrar Pago
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/delegate/training')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Asistencia Entrenamientos
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/delegate/reports')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Reportes
              </Button>
            </CardContent>
          </Card>

          {/* Athletes by Category */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Atletas por Categoría</CardTitle>
              <CardDescription>Distribución actual</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : stats?.athletesByCategory && Object.keys(stats.athletesByCategory).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.athletesByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{categoryLabels[category] || category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay atletas registrados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Birthdays */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" />
                Próximos Cumpleaños
              </CardTitle>
              <CardDescription>En los próximos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.upcomingBirthdays && stats.upcomingBirthdays.length > 0 ? (
                <div className="space-y-2">
                  {stats.upcomingBirthdays.slice(0, 5).map((birthday) => (
                    <div key={birthday.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{birthday.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(birthday.date_of_birth), 'd MMMM', { locale: es })}
                        </p>
                      </div>
                      <Badge variant={birthday.daysUntil === 0 ? 'default' : 'secondary'}>
                        {birthday.daysUntil === 0 ? '¡Hoy!' : `${birthday.daysUntil} días`}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay cumpleaños próximos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {stats && stats.pendingPayments > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {stats.pendingPayments} pagos de competencias pendientes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(stats.pendingPaymentsAmount, currency)}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/delegate/payments')}>
                  Ver Pagos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DelegateDashboard;
