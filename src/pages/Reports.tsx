import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign, Trophy, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const handleDownloadReport = (reportType: string) => {
    toast({
      title: "Descargando reporte",
      description: `El reporte de ${reportType} se está generando...`,
    });
  };

  const financialStats = [
    { title: "Ingresos Totales", value: "$85,240", icon: DollarSign, change: "+12%" },
    { title: "Pagos Pendientes", value: "$12,450", icon: Clock, change: "-5%" },
    { title: "Gastos del Mes", value: "$23,100", icon: FileText, change: "+8%" },
    { title: "Balance Neto", value: "$62,140", icon: TrendingUp, change: "+15%" },
  ];

  const reportTypes = [
    {
      title: "Reporte Financiero",
      description: "Ingresos, gastos y balance general",
      icon: DollarSign,
      category: "financial"
    },
    {
      title: "Reporte de Deportistas",
      description: "Estadísticas y rendimiento de atletas",
      icon: Users,
      category: "athletes"
    },
    {
      title: "Reporte de Competencias",
      description: "Resultados y participación en eventos",
      icon: Trophy,
      category: "competitions"
    },
    {
      title: "Reporte de Entrenamientos",
      description: "Asistencia y progreso en entrenamientos",
      icon: Calendar,
      category: "training"
    }
  ];

  return (
    <DashboardLayout title="Reportes" userRole="Administrador">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
            <p className="text-muted-foreground">Genera y descarga reportes del sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="athletes">Deportistas</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financialStats.map((stat, index) => (
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

            {/* Quick Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Reportes Rápidos</CardTitle>
                <CardDescription>Genera reportes predefinidos del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportTypes.map((report, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <report.icon className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleDownloadReport(report.title)} 
                        className="w-full"
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de ingresos mensuales
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de distribución de gastos
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">Pago de inscripción - Juan Pérez</p>
                        <p className="text-sm text-muted-foreground">Hace 2 horas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+$150</p>
                        <p className="text-sm text-muted-foreground">Completado</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="athletes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Deportistas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Activos</span>
                      <span className="font-semibold">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nuevos este mes</span>
                      <span className="font-semibold text-green-600">+12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Por categoría:</span>
                    </div>
                    <div className="ml-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Junior</span>
                        <span>45</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Senior</span>
                        <span>78</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Masters</span>
                        <span>33</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Nivel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de rendimiento por nivel
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asistencia a Entrenamientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de asistencia mensual
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resultados de Competencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de resultados por competencia
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((position) => (
                    <div key={position} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                          {position}
                        </div>
                        <div>
                          <p className="font-medium">Atleta {position}</p>
                          <p className="text-sm text-muted-foreground">Categoría Senior</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">95.5 pts</p>
                        <p className="text-sm text-muted-foreground">Promedio</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;