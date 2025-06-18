
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  Calendar, 
  BarChart3, 
  Trophy, 
  FileText, 
  MessageSquare, 
  Settings,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

const LeaderDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { title: "Equipos Activos", value: "8", icon: Users, change: "+2%" },
    { title: "Proyectos en Curso", value: "12", icon: Target, change: "+15%" },
    { title: "Objetivos Cumplidos", value: "85%", icon: Trophy, change: "+5%" },
    { title: "Reuniones Programadas", value: "6", icon: Calendar, change: "Esta semana" },
  ];

  const quickActions = [
    { 
      title: "Gestión de Equipos", 
      description: "Administrar equipos y asignaciones", 
      icon: Users,
      action: () => navigate('/teams-management') 
    },
    { 
      title: "Planificación Estratégica", 
      description: "Objetivos y estrategias", 
      icon: Target,
      action: () => navigate('/strategic-planning') 
    },
    { 
      title: "Seguimiento de Proyectos", 
      description: "Estado y progreso de proyectos", 
      icon: BarChart3,
      action: () => navigate('/project-tracking') 
    },
    { 
      title: "Comunicaciones", 
      description: "Mensajes y anuncios", 
      icon: MessageSquare,
      action: () => navigate('/communications') 
    },
  ];

  const recentActivities = [
    { activity: "Reunión de equipo completada - Equipo Alpha", time: "1h", status: "completed" },
    { activity: "Objetivo Q1 alcanzado - 95% cumplimiento", time: "2h", status: "completed" },
    { activity: "Nueva asignación - Proyecto Beta", time: "4h", status: "pending" },
    { activity: "Revisión semanal programada", time: "1d", status: "scheduled" },
  ];

  const upcomingMeetings = [
    { title: "Reunión de Coordinación", time: "10:00 AM", participants: "5 miembros" },
    { title: "Revisión de Objetivos", time: "2:00 PM", participants: "8 miembros" },
    { title: "Planificación Semanal", time: "4:00 PM", participants: "3 líderes" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout title="Dashboard Líder/Coordinador" userRole="Líder">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> desde el período anterior
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <action.icon className="h-5 w-5" />
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={action.action} className="w-full">
                  Acceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividades Recientes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Actividades Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(activity.status)}
                    <span className="text-sm font-medium">{activity.activity}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                Ver todas las actividades
              </Button>
            </CardContent>
          </Card>

          {/* Próximas Reuniones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Reuniones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMeetings.map((meeting, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{meeting.title}</h4>
                  <p className="text-xs text-muted-foreground">{meeting.time}</p>
                  <p className="text-xs text-blue-600">{meeting.participants}</p>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Ver calendario completo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reportes y Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rendimiento del Equipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Productividad General</span>
                  <span className="text-sm font-semibold text-green-600">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Objetivos Cumplidos</span>
                  <span className="text-sm font-semibold text-green-600">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Satisfacción del Equipo</span>
                  <span className="text-sm font-semibold text-blue-600">88%</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar reporte detallado
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración y Herramientas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gestionar permisos de equipo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Configurar objetivos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Plantillas de comunicación
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Exportar datos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaderDashboard;
