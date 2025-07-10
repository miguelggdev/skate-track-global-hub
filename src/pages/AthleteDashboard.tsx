
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Heart, 
  MapPin, 
  GraduationCap, 
  FileText, 
  Users, 
  CreditCard,
  Zap,
  Wrench,
  Trophy,
  Smile,
  Calendar,
  Download,
  Upload
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const AthleteDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');

  // Mock data for the athlete
  const athleteData = {
    name: "Juan Pérez",
    age: 16,
    category: "Juvenil",
    club: "SpeedSkate Academy",
    email: "juan.perez@email.com",
    phone: "3001234567"
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const paymentStatus = {
    'Enero': true, 'Febrero': true, 'Marzo': false, 'Abril': false,
    'Mayo': false, 'Junio': false, 'Julio': false, 'Agosto': false,
    'Septiembre': false, 'Octubre': false, 'Noviembre': false, 'Diciembre': false
  };

  return (
    <DashboardLayout title="Mi Perfil Deportivo" userRole="Deportista">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">¡Hola, {athleteData.name}!</CardTitle>
                <CardDescription>
                  {athleteData.category} • {athleteData.club}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="body">Mi Cuerpo</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="studies">Estudios</TabsTrigger>
            <TabsTrigger value="files">Archivos</TabsTrigger>
            <TabsTrigger value="family">Familia</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="skates">Patines</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="hobbies">Hobbys</TabsTrigger>
          </TabsList>

          {/* 1. Perfil General */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Perfil General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombres y Apellidos</Label>
                    <Input id="name" defaultValue={athleteData.name} />
                  </div>
                  <div>
                    <Label htmlFor="gender">Sexo</Label>
                    <Select defaultValue="M">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="age">Edad</Label>
                    <Input id="age" value={athleteData.age} disabled />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Input id="category" value={athleteData.category} disabled />
                  </div>
                  <div>
                    <Label htmlFor="docType">Tipo de Documento</Label>
                    <Select defaultValue="TI">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="docNumber">Número de Documento</Label>
                    <Input id="docNumber" placeholder="Ingresa tu número de documento" />
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4">
                  <Button>Actualizar Información</Button>
                  <Button variant="outline">Cambiar Contraseña</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Mi Cuerpo */}
          <TabsContent value="body">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Mi Cuerpo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input id="weight" type="number" placeholder="65" />
                  </div>
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input id="height" type="number" placeholder="170" />
                  </div>
                  <div>
                    <Label htmlFor="size">Talla</Label>
                    <Input id="size" placeholder="M" />
                  </div>
                  <div>
                    <Label htmlFor="bloodType">Tipo de Sangre</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="allergies">Alergias</Label>
                    <Input id="allergies" placeholder="Describe cualquier alergia conocida" />
                  </div>
                  <div>
                    <Label htmlFor="surgeries">Cirugías</Label>
                    <Input id="surgeries" placeholder="Cirugías previas" />
                  </div>
                  <div>
                    <Label htmlFor="injuries">Lesiones</Label>
                    <Input id="injuries" placeholder="Lesiones importantes" />
                  </div>
                  <div>
                    <Label htmlFor="limitations">Limitaciones Físicas</Label>
                    <Input id="limitations" placeholder="Limitaciones o restricciones" />
                  </div>
                </div>
                <Button>Guardar Información Médica</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Mi Contacto */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Mi Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthPlace">Lugar de Nacimiento</Label>
                    <Input id="birthPlace" placeholder="Ciudad, País" />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input id="birthDate" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" defaultValue={athleteData.phone} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={athleteData.email} />
                  </div>
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" placeholder="Dirección completa" />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Barrio</Label>
                    <Input id="neighborhood" placeholder="Barrio" />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" placeholder="Ciudad" />
                  </div>
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Select defaultValue="CO">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CO">Colombia</SelectItem>
                        <SelectItem value="US">Estados Unidos</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                        <SelectItem value="ES">España</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button>Actualizar Contacto</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Mis Estudios */}
          <TabsContent value="studies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Mis Estudios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="educationLevel">Nivel Educativo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primaria">Primaria</SelectItem>
                        <SelectItem value="secundaria">Secundaria</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="universitario">Universitario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currentGrade">Curso Actual</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(11)].map((_, i) => (
                          <SelectItem key={i+1} value={`${i+1}`}>{i+1}°</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="school">Institución educativa Actual</Label>
                    <Input id="school" placeholder="Nombre de la institución educativa" />
                  </div>
                  <div>
                    <Label htmlFor="schoolAddress">Dirección de la Institución educativa</Label>
                    <Input id="schoolAddress" placeholder="Dirección" />
                  </div>
                  <div>
                    <Label htmlFor="schoolPhone">Teléfono de la Institución educativa</Label>
                    <Input id="schoolPhone" placeholder="Teléfono" />
                  </div>
                  <div>
                    <Label htmlFor="schoolEmail">Correo de la Institución educativa</Label>
                    <Input id="schoolEmail" type="email" placeholder="Email" />
                  </div>
                </div>
                <Button>Guardar Información Académica</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Mis Archivos */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mis Archivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    'Copia de Documento',
                    'Carnet EPS',
                    'Carnet de Liga',
                    'Carnet Federación',
                    'Póliza de Accidentes',
                    'Autorización de Datos'
                  ].map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">{doc}</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Subir
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Mi Familia */}
          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mi Familia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-4">Información de Padres</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="parentName">Nombres y Apellidos</Label>
                        <Input id="parentName" placeholder="Nombre completo del padre/madre" />
                      </div>
                      <div>
                        <Label htmlFor="parentPhone">Teléfono</Label>
                        <Input id="parentPhone" placeholder="Teléfono" />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="parentEmail">Email</Label>
                        <Input id="parentEmail" type="email" placeholder="Email" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-4">Acudiente Autorizado</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guardianName">Nombre del Acudiente</Label>
                        <Input id="guardianName" placeholder="Si es diferente a los padres" />
                      </div>
                      <div>
                        <Label htmlFor="relationship">Parentesco</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tio">Tío/Tía</SelectItem>
                            <SelectItem value="abuelo">Abuelo/Abuela</SelectItem>
                            <SelectItem value="hermano">Hermano/Hermana</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="guardianPhone">Teléfono</Label>
                        <Input id="guardianPhone" placeholder="Teléfono" />
                      </div>
                      <div>
                        <Label htmlFor="guardianEmail">Email</Label>
                        <Input id="guardianEmail" type="email" placeholder="Email" />
                      </div>
                    </div>
                  </div>
                </div>
                <Button>Guardar Información Familiar</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 7. Mis Pagos */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Mis Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label>Valor Mensualidad</Label>
                    <div className="text-2xl font-bold text-green-600">$150.000 COP</div>
                  </div>
                  <div>
                    <Label htmlFor="year">Año</Label>
                    <Select defaultValue="2024">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {months.map((month) => (
                    <div key={month} className={`border rounded-lg p-3 text-center ${
                      paymentStatus[month] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="font-medium">{month}</div>
                      <div className={`text-sm ${
                        paymentStatus[month] ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {paymentStatus[month] ? 'Pagado' : 'Pendiente'}
                      </div>
                      {paymentStatus[month] && (
                        <Button size="sm" variant="outline" className="mt-2">
                          <Download className="h-3 w-3 mr-1" />
                          Recibo
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 8. Mis Patines */}
          <TabsContent value="skates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Mis Patines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Información de Bota</h4>
                    <div>
                      <Label htmlFor="bootBrand">Marca de Bota</Label>
                      <Input id="bootBrand" placeholder="Ej: Bont, Luigino" />
                    </div>
                    <div>
                      <Label htmlFor="bootSize">Número de Bota</Label>
                      <Input id="bootSize" type="number" placeholder="Ej: 42" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Chasis y Ruedas</h4>
                    <div>
                      <Label htmlFor="frameBrand">Marca de Chasis</Label>
                      <Input id="frameBrand" placeholder="Ej: Roll-Line, Atom" />
                    </div>
                    <div>
                      <Label htmlFor="frameSize">Medidas de Chasis</Label>
                      <Input id="frameSize" placeholder="Ej: 13 pulgadas" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Ruedas de Pista</h4>
                    <div>
                      <Label htmlFor="trackWheels">Marca de Ruedas</Label>
                      <Input id="trackWheels" placeholder="Ej: Matter, Hyper" />
                    </div>
                    <div>
                      <Label htmlFor="wheelDiameter">Diámetro</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="80">80mm</SelectItem>
                          <SelectItem value="84">84mm</SelectItem>
                          <SelectItem value="90">90mm</SelectItem>
                          <SelectItem value="100">100mm</SelectItem>
                          <SelectItem value="110">110mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Equipo de Protección</h4>
                    <div>
                      <Label htmlFor="helmet">Marca de Casco</Label>
                      <Input id="helmet" placeholder="Ej: Pro-tec, Bauer" />
                    </div>
                  </div>
                </div>
                <Button>Guardar Información de Equipo</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 9. Mantenimiento */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Mantenimiento de Patines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Nuevo Mantenimiento
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { date: '2024-01-15', type: 'Cambio de ruedas', description: 'Cambio completo de ruedas de pista' },
                    { date: '2024-01-10', type: 'Ajuste de chasis', description: 'Alineación y ajuste de tornillos' },
                    { date: '2024-01-05', type: 'Limpieza general', description: 'Limpieza y lubricación' }
                  ].map((maintenance, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{maintenance.type}</h4>
                          <p className="text-sm text-gray-600">{maintenance.description}</p>
                        </div>
                        <span className="text-sm text-gray-500">{maintenance.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 10. Historial */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Historial de Patinaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="previousClub">Escuela/Club Anterior</Label>
                    <Input id="previousClub" placeholder="Si has pertenecido a otro club" />
                  </div>
                  <div>
                    <Label htmlFor="yearsExperience">Años de Práctica</Label>
                    <Input id="yearsExperience" type="number" placeholder="Años" />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Fecha de Inicio en el Patinaje</Label>
                    <Input id="startDate" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="leagueDate">Fecha de Liga</Label>
                    <Input id="leagueDate" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="federationDate">Fecha de Federación</Label>
                    <Input id="federationDate" type="date" />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="isLeague" />
                    <Label htmlFor="isLeague">¿Ligado a Liga?</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="isFederated" />
                    <Label htmlFor="isFederated">¿Federado?</Label>
                  </div>
                </div>
                
                <Button>Actualizar Historial</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 11. Hobbys */}
          <TabsContent value="hobbies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5" />
                  Mis Hobbys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hobbies">Hobbys e Intereses</Label>
                  <textarea 
                    id="hobbies"
                    className="w-full min-h-[120px] p-3 border rounded-md"
                    placeholder="Cuéntanos sobre tus hobbys, intereses y actividades que te gustan fuera del patinaje..."
                  />
                </div>
                <Button>Guardar Hobbys</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AthleteDashboard;
