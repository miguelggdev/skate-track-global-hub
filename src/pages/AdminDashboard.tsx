
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Trophy, DollarSign, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { title: "Total Deportistas", value: "156", icon: Users, change: "+12%" },
    { title: "Entrenamientos", value: "24", icon: Calendar, change: "+5%" },
    { title: "Competencias Activas", value: "8", icon: Trophy, change: "+2" },
    { title: "Recaudo Mensual", value: "$2.4M", icon: DollarSign, change: "+18%" },
  ];

  const quickActions = [
    { title: "Gestionar Usuarios", description: "Crear y administrar perfiles", action: () => navigate('/user-management') },
    { title: "Configurar Club", description: "Logo, colores y datos", action: () => navigate('/club-config') },
    { title: "Crear Competencia", description: "Nueva competencia", action: () => navigate('/competitions') },
    { title: "Reportes", description: "Generar reportes", action: () => navigate('/reports') },
  ];

  return (
    <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
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
                  <span className="text-green-600">{stat.change}</span> desde el mes pasado
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
                <CardTitle className="text-lg">{action.title}</CardTitle>
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

        {/* Gráficos y Resumen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Crecimiento del Club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Gráfico de crecimiento mensual
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Nueva inscripción - Juan Pérez</span>
                <span className="text-xs text-muted-foreground">2h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pago recibido - María García</span>
                <span className="text-xs text-muted-foreground">4h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Competencia creada - Regional 2024</span>
                <span className="text-xs text-muted-foreground">1d</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
