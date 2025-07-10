
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Calendar, 
  Trophy, 
  BarChart3, 
  Clock, 
  Target,
  FileText,
  MessageSquare,
  Plus,
  Filter,
  Download,
  Mail
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateTrainingDialog from '@/components/training/CreateTrainingDialog';

const CoachDashboard = () => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // KPIs del entrenador
  const kpis = [
    { title: "Entrenamientos Hoy", value: "3", icon: Calendar, change: "+1" },
    { title: "Deportistas Activos", value: "24", icon: Users, change: "+2" },
    { title: "Evaluaciones Pendientes", value: "5", icon: Target, change: "-2" },
    { title: "Asistencia Promedio", value: "87%", icon: BarChart3, change: "+5%" },
  ];

  // Deportistas mock data
  const athletes = [
    {
      id: 1,
      name: "Juan Pérez",
      category: "Juvenil",
      attendance: 92,
      lastEvaluation: "2024-01-10",
      recentTimes: "2:30.45",
      photo: "/placeholder.svg"
    },
    {
      id: 2,
      name: "María García",
      category: "Menores",
      attendance: 88,
      lastEvaluation: "2024-01-08",
      recentTimes: "2:45.12",
      photo: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Carlos López",
      category: "Transición",
      attendance: 95,
      lastEvaluation: "2024-01-12",
      recentTimes: "2:15.33",
      photo: "/placeholder.svg"
    },
  ];

  // Entrenamientos de la semana
  const weekTrainings = [
    { day: "Lunes", time: "16:00", type: "Técnica", participants: 12 },
    { day: "Miércoles", time: "16:00", type: "Resistencia", participants: 15 },
    { day: "Viernes", time: "16:00", type: "Velocidad", participants: 10 },
    { day: "Sábado", time: "09:00", type: "Competencia", participants: 8 },
  ];

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || athlete.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout title="Dashboard Entrenador" userRole="Entrenador">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{kpi.change}</span> desde la semana pasada
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráficos y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Progreso Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Gráfico de entrenamientos y asistencia semanal
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Calendario Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weekTrainings.map((training, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{training.day}</span>
                    <span className="text-sm text-gray-500 ml-2">{training.time}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{training.type}</div>
                    <div className="text-xs text-gray-500">{training.participants} deportistas</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Panel de Deportistas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mis Deportistas
            </CardTitle>
            <CardDescription>
              Gestiona y supervisa el progreso de tus deportistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Buscar deportista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="Menores">Menores</SelectItem>
                  <SelectItem value="Juvenil">Juvenil</SelectItem>
                  <SelectItem value="Transición">Transición</SelectItem>
                  <SelectItem value="Mayores">Mayores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de deportistas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAthletes.map((athlete) => (
                <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{athlete.name}</h3>
                        <p className="text-sm text-gray-500">{athlete.category}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Asistencia:</span>
                        <span className="font-medium">{athlete.attendance}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Último tiempo:</span>
                        <span className="font-medium">{athlete.recentTimes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última evaluación:</span>
                        <span className="text-xs">{athlete.lastEvaluation}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        Ver Perfil
                      </Button>
                      <Button size="sm" className="flex-1">
                        Evaluar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Herramientas del Entrenador */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Crear Entrenamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateTrainingDialog>
                <Button className="w-full">
                  Nuevo Entrenamiento
                </Button>
              </CreateTrainingDialog>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Plantillas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Plantillas
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Bandeja
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5" />
                Competencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Eventos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reportes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Reportes Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reporte General
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progreso Individual
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Enviar por Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CoachDashboard;
