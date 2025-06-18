
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Calendar, CreditCard, FileText, Bell, Heart, Phone, Mail, MapPin, User, GraduationCap, Clock } from 'lucide-react';

const DelegateDashboard = () => {
  const userRole = localStorage.getItem('userRole') || '';

  return (
    <DashboardLayout title="Panel del Delegado" userRole={userRole}>
      <div className="space-y-6">
        {/* KPIs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hijos Registrados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Deportistas activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Competencias</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€450</div>
              <p className="text-xs text-muted-foreground">2 cuotas vencidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Sin leer</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="children" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="children">Mis Hijos</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="communications">Comunicaciones</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          </TabsList>

          {/* Mis Hijos Tab */}
          <TabsContent value="children" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Deportistas a mi cargo
                </CardTitle>
                <CardDescription>
                  Información y progreso de mis hijos deportistas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Ana García</CardTitle>
                        <Badge variant="default">Activa</Badge>
                      </div>
                      <CardDescription>Categoría Juvenil • 16 años</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Entrenador:</strong> Carlos Ruiz</div>
                        <div><strong>Categoría:</strong> Sub-18</div>
                        <div><strong>Último entrenamiento:</strong> Ayer</div>
                        <div><strong>Próxima competencia:</strong> 15 Jul</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Ver Progreso</Button>
                        <Button size="sm" variant="outline">Calendario</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Miguel García</CardTitle>
                        <Badge variant="secondary">Lesionado</Badge>
                      </div>
                      <CardDescription>Categoría Cadete • 14 años</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Entrenador:</strong> Laura Martín</div>
                        <div><strong>Categoría:</strong> Sub-16</div>
                        <div><strong>Estado:</strong> Recuperación</div>
                        <div><strong>Vuelta estimada:</strong> 1 semana</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Ver Progreso</Button>
                        <Button size="sm" variant="outline">Seguimiento Médico</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
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
                  Cuotas, equipamiento y gastos de competencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">Pagos Vencidos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">€250</div>
                        <p className="text-xs text-muted-foreground">Cuota Junio - Ana</p>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-yellow-600">Próximos Vencimientos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">€500</div>
                        <p className="text-xs text-muted-foreground">Vence en 5 días</p>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-600">Total Pagado 2024</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">€2,850</div>
                        <p className="text-xs text-muted-foreground">Ambos deportistas</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Deportista</TableHead>
                        <TableHead>Importe</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Cuota Mensual Julio</TableCell>
                        <TableCell>Ana García</TableCell>
                        <TableCell>€250</TableCell>
                        <TableCell>01/07/2024</TableCell>
                        <TableCell><Badge variant="destructive">Vencida</Badge></TableCell>
                        <TableCell>
                          <Button size="sm">Pagar Ahora</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Equipo Patines</TableCell>
                        <TableCell>Miguel García</TableCell>
                        <TableCell>€350</TableCell>
                        <TableCell>15/07/2024</TableCell>
                        <TableCell><Badge variant="secondary">Pendiente</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Ver Detalles</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Competencia Nacional</TableCell>
                        <TableCell>Ana García</TableCell>
                        <TableCell>€150</TableCell>
                        <TableCell>20/07/2024</TableCell>
                        <TableCell><Badge variant="secondary">Pendiente</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Inscribir</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendario Familiar
                </CardTitle>
                <CardDescription>
                  Entrenamientos, competencias y eventos de mis hijos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Esta Semana</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <p className="font-medium">Entrenamiento - Ana</p>
                            <p className="text-sm text-muted-foreground">Hoy 17:00 - 19:00</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <div className="flex-1">
                            <p className="font-medium">Competencia Regional - Miguel</p>
                            <p className="text-sm text-muted-foreground">Sábado 09:00</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Heart className="h-4 w-4 text-red-500" />
                          <div className="flex-1">
                            <p className="font-medium">Revisión Médica - Miguel</p>
                            <p className="text-sm text-muted-foreground">Viernes 16:00</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Próximos Eventos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <div className="flex-1">
                            <p className="font-medium">Campeonato Nacional</p>
                            <p className="text-sm text-muted-foreground">15-17 Julio • Madrid</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Users className="h-4 w-4 text-orange-500" />
                          <div className="flex-1">
                            <p className="font-medium">Reunión de Padres</p>
                            <p className="text-sm text-muted-foreground">22 Julio 19:00</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <GraduationCap className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <p className="font-medium">Curso Arbitraje</p>
                            <p className="text-sm text-muted-foreground">25 Julio</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Centro de Comunicaciones
                </CardTitle>
                <CardDescription>
                  Mensajes de entrenadores, avisos del club y notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button className="h-20 flex flex-col gap-2">
                      <Mail className="h-5 w-5" />
                      <span>Mensajes</span>
                      <Badge variant="destructive" className="text-xs">3 nuevos</Badge>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2">
                      <Bell className="h-5 w-5" />
                      <span>Notificaciones</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2">
                      <Phone className="h-5 w-5" />
                      <span>Contactar Club</span>
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Mensajes Recientes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">Carlos Ruiz (Entrenador de Ana)</p>
                            <span className="text-sm text-muted-foreground">Hace 2h</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Ana ha mostrado gran progreso en los últimos entrenamientos. 
                            Recomiendo aumentar la frecuencia a 4 días por semana.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">Secretaría del Club</p>
                            <span className="text-sm text-muted-foreground">Ayer</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Recordatorio: La cuota de julio vence el día 1. 
                            Pueden realizar el pago online o en recepción.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">Laura Martín (Entrenadora de Miguel)</p>
                            <span className="text-sm text-muted-foreground">Hace 3 días</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Miguel debe continuar con la fisioterapia. 
                            La evolución es positiva, pero necesita otra semana de descanso.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos y Certificados
                </CardTitle>
                <CardDescription>
                  Certificados médicos, autorizaciones y documentación oficial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Ana García - Documentos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">Certificado Médico</span>
                          <div className="flex gap-2">
                            <Badge variant="default">Vigente</Badge>
                            <Button size="sm" variant="outline">Ver</Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">Autorización Competencias</span>
                          <div className="flex gap-2">
                            <Badge variant="default">Vigente</Badge>
                            <Button size="sm" variant="outline">Ver</Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">Seguro Deportivo</span>
                          <div className="flex gap-2">
                            <Badge variant="destructive">Vence en 30 días</Badge>
                            <Button size="sm" variant="outline">Renovar</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Miguel García - Documentos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">Certificado Médico</span>
                          <div className="flex gap-2">
                            <Badge variant="secondary">Renovación Pendiente</Badge>
                            <Button size="sm" variant="outline">Subir</Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">Autorización Competencias</span>
                          <div className="flex gap-2">
                            <Badge variant="default">Vigente</Badge>
                            <Button size="sm" variant="outline">Ver</Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">Informe Fisioterapia</span>
                          <div className="flex gap-2">
                            <Badge variant="default">Actualizado</Badge>
                            <Button size="sm" variant="outline">Ver</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Subir Nuevo Documento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="athlete">Deportista</Label>
                          <select className="w-full p-2 border rounded">
                            <option>Ana García</option>
                            <option>Miguel García</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctype">Tipo de Documento</Label>
                          <select className="w-full p-2 border rounded">
                            <option>Certificado Médico</option>
                            <option>Autorización</option>
                            <option>Seguro</option>
                            <option>Otro</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="file">Archivo</Label>
                          <Input type="file" />
                        </div>
                      </div>
                      <Button className="mt-4">Subir Documento</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mi Perfil de Delegado
                </CardTitle>
                <CardDescription>
                  Información personal y configuración de cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Información Personal</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Nombre</Label>
                          <Input id="firstName" defaultValue="María" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Apellidos</Label>
                          <Input id="lastName" defaultValue="García López" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="maria.garcia@email.com" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input id="phone" defaultValue="+34 666 777 888" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Teléfono Emergencia</Label>
                          <Input id="emergencyPhone" defaultValue="+34 666 999 000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" defaultValue="Calle Mayor 123, Madrid" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Información Familiar</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="relationship">Parentesco</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Madre</option>
                          <option>Padre</option>
                          <option>Tutor Legal</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Deportistas a Cargo</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span>Ana García (16 años)</span>
                            <Badge>Hija</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span>Miguel García (14 años)</span>
                            <Badge>Hijo</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold">Configuración</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Notificaciones por Email</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Notificaciones SMS</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Recordatorios de Pago</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button>Guardar Cambios</Button>
                  <Button variant="outline">Cambiar Contraseña</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DelegateDashboard;
