
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  FileText,
  CreditCard,
  PieChart,
  Calculator,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const FinanceDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  return (
    <DashboardLayout title="Panel Financiero" userRole="Gestor Financiero">
      <div className="space-y-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€45,231.89</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +20.1% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€23,456.78</div>
              <p className="text-xs text-muted-foreground">
                -5.2% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€8,924.00</div>
              <p className="text-xs text-muted-foreground">
                24 facturas pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">
                +12 nuevos este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
            <TabsTrigger value="reports">Informes</TabsTrigger>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribución de Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cuotas de Socios</span>
                        <span>65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Competiciones</span>
                        <span>20%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Patrocinios</span>
                        <span>15%</span>
                      </div>
                      <Progress value={15} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximos Vencimientos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">Cuotas Enero</p>
                        <p className="text-sm text-muted-foreground">Vence: 31/01/2024</p>
                      </div>
                      <span className="text-lg font-bold">€2,450</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">Alquiler Instalaciones</p>
                        <p className="text-sm text-muted-foreground">Vence: 15/01/2024</p>
                      </div>
                      <span className="text-lg font-bold">€1,200</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">Seguros</p>
                        <p className="text-sm text-muted-foreground">Vence: 20/01/2024</p>
                      </div>
                      <span className="text-lg font-bold">€850</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gestión de Pagos
                </CardTitle>
                <CardDescription>
                  Administra los pagos de cuotas y servicios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search-payment">Buscar Pago</Label>
                      <Input id="search-payment" placeholder="Buscar por nombre o concepto..." />
                    </div>
                    <div className="w-48">
                      <Label htmlFor="payment-status">Estado</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-lg">
                    <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                      <span>Miembro</span>
                      <span>Concepto</span>
                      <span>Cantidad</span>
                      <span>Estado</span>
                      <span>Acciones</span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4 p-4 border-b">
                      <span>Ana García</span>
                      <span>Cuota Enero 2024</span>
                      <span>€85.00</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Pagado
                      </span>
                      <Button variant="outline" size="sm">Ver Detalles</Button>
                    </div>

                    <div className="grid grid-cols-5 gap-4 p-4 border-b">
                      <span>Carlos Ruiz</span>
                      <span>Cuota Enero 2024</span>
                      <span>€85.00</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        Pendiente
                      </span>
                      <Button variant="outline" size="sm">Enviar Recordatorio</Button>
                    </div>

                    <div className="grid grid-cols-5 gap-4 p-4">
                      <span>María López</span>
                      <span>Competición Nacional</span>
                      <span>€150.00</span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Vencido
                      </span>
                      <Button variant="destructive" size="sm">Gestionar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Gestión de Presupuestos
                </CardTitle>
                <CardDescription>
                  Planifica y controla los presupuestos anuales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Presupuesto Anual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">€120,000</div>
                        <Progress value={45} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">45% ejecutado</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Gastos Operativos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">€78,500</div>
                        <Progress value={62} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">62% ejecutado</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Inversiones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">€25,000</div>
                        <Progress value={30} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">30% ejecutado</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Desglose por Categorías</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span>Personal y Entrenadores</span>
                        <div className="text-right">
                          <div className="font-medium">€45,000 / €60,000</div>
                          <Progress value={75} className="w-32 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span>Instalaciones y Mantenimiento</span>
                        <div className="text-right">
                          <div className="font-medium">€18,000 / €25,000</div>
                          <Progress value={72} className="w-32 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span>Equipamiento Deportivo</span>
                        <div className="text-right">
                          <div className="font-medium">€8,500 / €15,000</div>
                          <Progress value={57} className="w-32 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span>Competiciones y Viajes</span>
                        <div className="text-right">
                          <div className="font-medium">€12,000 / €20,000</div>
                          <Progress value={60} className="w-32 mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informes Financieros
                </CardTitle>
                <CardDescription>
                  Genera y descarga informes financieros detallados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="report-period">Período del Informe</Label>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Esta Semana</SelectItem>
                          <SelectItem value="month">Este Mes</SelectItem>
                          <SelectItem value="quarter">Este Trimestre</SelectItem>
                          <SelectItem value="year">Este Año</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="report-type">Tipo de Informe</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Ingresos</SelectItem>
                          <SelectItem value="expenses">Gastos</SelectItem>
                          <SelectItem value="balance">Balance General</SelectItem>
                          <SelectItem value="members">Estado de Cuotas</SelectItem>
                          <SelectItem value="complete">Informe Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button>Generar Informe</Button>
                    <Button variant="outline">Vista Previa</Button>
                    <Button variant="outline">Exportar PDF</Button>
                    <Button variant="outline">Exportar Excel</Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informes Recientes</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Informe Mensual - Diciembre 2023</p>
                          <p className="text-sm text-muted-foreground">Generado el 01/01/2024</p>
                        </div>
                        <Button variant="outline" size="sm">Descargar</Button>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Balance Trimestral Q4 2023</p>
                          <p className="text-sm text-muted-foreground">Generado el 31/12/2023</p>
                        </div>
                        <Button variant="outline" size="sm">Descargar</Button>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Estado de Cuotas - Diciembre</p>
                          <p className="text-sm text-muted-foreground">Generado el 30/12/2023</p>
                        </div>
                        <Button variant="outline" size="sm">Descargar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Control de Gastos
                </CardTitle>
                <CardDescription>
                  Registra y categoriza todos los gastos del club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Registrar Nuevo Gasto</h3>
                    <Button>+ Nuevo Gasto</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="expense-concept">Concepto</Label>
                      <Input id="expense-concept" placeholder="Descripción del gasto" />
                    </div>
                    <div>
                      <Label htmlFor="expense-amount">Cantidad</Label>
                      <Input id="expense-amount" type="number" placeholder="0.00" />
                    </div>
                    <div>
                      <Label htmlFor="expense-category">Categoría</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Personal</SelectItem>
                          <SelectItem value="facilities">Instalaciones</SelectItem>
                          <SelectItem value="equipment">Equipamiento</SelectItem>
                          <SelectItem value="travel">Viajes</SelectItem>
                          <SelectItem value="admin">Administrativos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expense-date">Fecha</Label>
                      <Input id="expense-date" type="date" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Gastos Recientes</h3>
                    <div className="border rounded-lg">
                      <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                        <span>Fecha</span>
                        <span>Concepto</span>
                        <span>Categoría</span>
                        <span>Cantidad</span>
                        <span>Acciones</span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4 p-4 border-b">
                        <span>15/01/2024</span>
                        <span>Mantenimiento pista</span>
                        <span>Instalaciones</span>
                        <span>€450.00</span>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4 p-4 border-b">
                        <span>12/01/2024</span>
                        <span>Uniformes nuevos</span>
                        <span>Equipamiento</span>
                        <span>€1,250.00</span>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4 p-4">
                        <span>10/01/2024</span>
                        <span>Viaje competición</span>
                        <span>Viajes</span>
                        <span>€890.00</span>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración Financiera</CardTitle>
                <CardDescription>
                  Ajusta la configuración del sistema financiero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cuotas y Tarifas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthly-fee">Cuota Mensual</Label>
                        <Input id="monthly-fee" type="number" defaultValue="85" />
                      </div>
                      <div>
                        <Label htmlFor="registration-fee">Cuota de Inscripción</Label>
                        <Input id="registration-fee" type="number" defaultValue="50" />
                      </div>
                      <div>
                        <Label htmlFor="competition-fee">Tarifa Competición</Label>
                        <Input id="competition-fee" type="number" defaultValue="150" />
                      </div>
                      <div>
                        <Label htmlFor="late-fee">Recargo por Retraso</Label>
                        <Input id="late-fee" type="number" defaultValue="10" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Métodos de Pago</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Transferencia Bancaria</span>
                        <Button variant="outline" size="sm">Configurar</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Domiciliación Bancaria</span>
                        <Button variant="outline" size="sm">Configurar</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Tarjeta de Crédito</span>
                        <Button variant="outline" size="sm">Configurar</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>PayPal</span>
                        <Button variant="outline" size="sm">Configurar</Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notificaciones</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Recordatorios de pago automáticos</span>
                        <Button variant="outline" size="sm">Activado</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Alertas de pagos vencidos</span>
                        <Button variant="outline" size="sm">Activado</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Informes mensuales automáticos</span>
                        <Button variant="outline" size="sm">Desactivado</Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>Guardar Configuración</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FinanceDashboard;
