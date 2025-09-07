import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Trophy, 
  Activity,
  Users,
  Heart,
  GraduationCap,
  Settings,
  History,
  MapPin,
  CreditCard,
  Shield,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { useAthleteDetails, AthleteDetails } from '@/hooks/useAthleteDetails';

interface AthleteDetailsDialogProps {
  athleteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AthleteDetailsDialog: React.FC<AthleteDetailsDialogProps> = ({
  athleteId,
  open,
  onOpenChange,
}) => {
  const { data: athlete, isLoading, error } = useAthleteDetails(athleteId);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateAge = (dateString: string) => {
    return Math.floor((Date.now() - new Date(dateString).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'injured': 'bg-red-100 text-red-800',
      'suspended': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'injured': 'Lesionado',
      'suspended': 'Suspendido',
    };
    return labels[status] || status;
  };

  const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null }> = ({
    icon,
    label,
    value,
  }) => (
    <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{value || 'No disponible'}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando detalles...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !athlete) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Error al cargar datos</DialogTitle>
          </DialogHeader>
          <p>No se pudieron cargar los detalles del atleta.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Atleta</DialogTitle>
        </DialogHeader>

        {/* Header with athlete info */}
        <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={athlete.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${athlete.first_name} ${athlete.last_name}`} 
            />
            <AvatarFallback>
              {getInitials(athlete.first_name, athlete.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold">
              {athlete.first_name} {athlete.last_name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(athlete.status)}>
                {getStatusLabel(athlete.status)}
              </Badge>
              {athlete.athlete_number && (
                <Badge variant="outline"># {athlete.athlete_number}</Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span className="capitalize">{athlete.category} - {athlete.level}</span>
              {athlete.date_of_birth && (
                <span>{calculateAge(athlete.date_of_birth)} años</span>
              )}
              <span>Ingreso: {formatDate(athlete.join_date)}</span>
            </div>
          </div>
          <div className="text-right">
            {athlete.performance_score && (
              <div className="text-2xl font-bold text-primary">
                {athlete.performance_score}%
              </div>
            )}
            <div className="text-sm text-muted-foreground">Rendimiento</div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="family">Familia</TabsTrigger>
            <TabsTrigger value="medical">Médico</TabsTrigger>
            <TabsTrigger value="studies">Estudios</TabsTrigger>
            <TabsTrigger value="equipment">Equipo</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Información Básica</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={athlete.email} />
                  <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono" value={athlete.phone} />
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha de Nacimiento" 
                    value={athlete.date_of_birth ? formatDate(athlete.date_of_birth) : null} />
                  <InfoItem icon={<CreditCard className="h-4 w-4" />} label="Número de ID" value={athlete.id_number} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Rendimiento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoItem icon={<Activity className="h-4 w-4" />} label="Puntuación" 
                    value={athlete.performance_score ? `${athlete.performance_score}%` : null} />
                  <InfoItem icon={<Shield className="h-4 w-4" />} label="Estado" value={getStatusLabel(athlete.status)} />
                  <InfoItem icon={<Zap className="h-4 w-4" />} label="Categoría" value={athlete.category} />
                  <InfoItem icon={<Settings className="h-4 w-4" />} label="Nivel" value={athlete.level} />
                </CardContent>
              </Card>
            </div>

            {athlete.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Biografía</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{athlete.bio}</p>
                </CardContent>
              </Card>
            )}

            {athlete.achievements && (
              <Card>
                <CardHeader>
                  <CardTitle>Logros</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{athlete.achievements}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={<User className="h-4 w-4" />} label="Nombre Completo" 
                    value={`${athlete.first_name} ${athlete.last_name}`} />
                  <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={athlete.email} />
                  <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono" value={athlete.phone} />
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha de Nacimiento" 
                    value={athlete.date_of_birth ? formatDate(athlete.date_of_birth) : null} />
                  <InfoItem icon={<CreditCard className="h-4 w-4" />} label="Tipo de ID" value={athlete.id_type} />
                  <InfoItem icon={<CreditCard className="h-4 w-4" />} label="Número de ID" value={athlete.id_number} />
                </div>
                {athlete.bio && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Biografía</h4>
                    <p className="text-muted-foreground">{athlete.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Información Familiar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athlete.family ? (
                  <div className="space-y-6">
                    {/* Parent Info */}
                    {athlete.family.parent_name && (
                      <div>
                        <h4 className="font-medium mb-3">Padre/Madre</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoItem icon={<User className="h-4 w-4" />} label="Nombre" value={athlete.family.parent_name} />
                          <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono" value={athlete.family.parent_phone} />
                          <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={athlete.family.parent_email} />
                        </div>
                      </div>
                    )}

                    {/* Guardian Info */}
                    {athlete.family.guardian_name && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-3">Tutor/Guardián</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoItem icon={<User className="h-4 w-4" />} label="Nombre" value={athlete.family.guardian_name} />
                            <InfoItem icon={<Users className="h-4 w-4" />} label="Relación" value={athlete.family.guardian_relationship} />
                            <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono" value={athlete.family.guardian_phone} />
                            <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={athlete.family.guardian_email} />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Emergency Contact */}
                    {athlete.emergency_contact_name && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-3">Contacto de Emergencia</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoItem icon={<User className="h-4 w-4" />} label="Nombre" value={athlete.emergency_contact_name} />
                            <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono" value={athlete.emergency_contact_phone} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay información familiar registrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Tab */}
          <TabsContent value="medical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Información Médica y Física</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athlete.body_info ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Medidas Físicas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoItem icon={<Activity className="h-4 w-4" />} label="Peso" 
                          value={athlete.body_info.weight ? `${athlete.body_info.weight} kg` : null} />
                        <InfoItem icon={<Activity className="h-4 w-4" />} label="Altura" 
                          value={athlete.body_info.height ? `${athlete.body_info.height} cm` : null} />
                        <InfoItem icon={<Settings className="h-4 w-4" />} label="Talla" value={athlete.body_info.size} />
                        <InfoItem icon={<Heart className="h-4 w-4" />} label="Tipo de Sangre" value={athlete.body_info.blood_type} />
                      </div>
                    </div>

                    {(athlete.body_info.allergies || athlete.body_info.surgeries || athlete.body_info.injuries || athlete.body_info.limitations) && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-3">Historial Médico</h4>
                          <div className="space-y-3">
                            {athlete.body_info.allergies && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-1">Alergias</h5>
                                <p className="text-sm">{athlete.body_info.allergies}</p>
                              </div>
                            )}
                            {athlete.body_info.surgeries && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-1">Cirugías</h5>
                                <p className="text-sm">{athlete.body_info.surgeries}</p>
                              </div>
                            )}
                            {athlete.body_info.injuries && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-1">Lesiones</h5>
                                <p className="text-sm">{athlete.body_info.injuries}</p>
                              </div>
                            )}
                            {athlete.body_info.limitations && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-1">Limitaciones</h5>
                                <p className="text-sm">{athlete.body_info.limitations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay información médica registrada.</p>
                )}

                {athlete.medical_notes && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Notas Médicas Adicionales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{athlete.medical_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Studies Tab */}
          <TabsContent value="studies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Información Académica</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athlete.studies ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Nivel Educativo" value={athlete.studies.education_level} />
                      <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Grado Actual" value={athlete.studies.current_grade} />
                      <InfoItem icon={<MapPin className="h-4 w-4" />} label="Centro Educativo" value={athlete.studies.school_name} />
                      <InfoItem icon={<MapPin className="h-4 w-4" />} label="Dirección" value={athlete.studies.school_address} />
                      <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono del Centro" value={athlete.studies.school_phone} />
                      <InfoItem icon={<Mail className="h-4 w-4" />} label="Email del Centro" value={athlete.studies.school_email} />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay información académica registrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Equipamiento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athlete.equipment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={<Settings className="h-4 w-4" />} label="Talla de Bota" 
                      value={athlete.equipment.boot_size?.toString()} />
                    <InfoItem icon={<Settings className="h-4 w-4" />} label="Diámetro de Rueda" 
                      value={athlete.equipment.wheel_diameter ? `${athlete.equipment.wheel_diameter}mm` : null} />
                    <InfoItem icon={<Settings className="h-4 w-4" />} label="Talla de Chasis" value={athlete.equipment.frame_size} />
                    <InfoItem icon={<Settings className="h-4 w-4" />} label="Marca de Bota" value={athlete.equipment.boot_brand} />
                    <InfoItem icon={<Settings className="h-4 w-4" />} label="Marca de Chasis" value={athlete.equipment.frame_brand} />
                    <InfoItem icon={<Settings className="h-4 w-4" />} label="Marca de Ruedas" value={athlete.equipment.track_wheels_brand} />
                    <InfoItem icon={<Settings className="h-4 w-4" />} label="Marca de Casco" value={athlete.equipment.helmet_brand} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay información de equipamiento registrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Historial Deportivo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athlete.history ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem icon={<Calendar className="h-4 w-4" />} label="Años de Experiencia" 
                        value={athlete.history.years_experience?.toString()} />
                      <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha de Inicio" 
                        value={athlete.history.start_date ? formatDate(athlete.history.start_date) : null} />
                      <InfoItem icon={<Trophy className="h-4 w-4" />} label="Fecha Liga" 
                        value={athlete.history.league_date ? formatDate(athlete.history.league_date) : null} />
                      <InfoItem icon={<Trophy className="h-4 w-4" />} label="Fecha Federación" 
                        value={athlete.history.federation_date ? formatDate(athlete.history.federation_date) : null} />
                      <InfoItem icon={<Shield className="h-4 w-4" />} label="En Liga" 
                        value={athlete.history.is_league ? 'Sí' : 'No'} />
                      <InfoItem icon={<Shield className="h-4 w-4" />} label="Federado" 
                        value={athlete.history.is_federated ? 'Sí' : 'No'} />
                      <InfoItem icon={<MapPin className="h-4 w-4" />} label="Club Anterior" value={athlete.history.previous_club} />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay historial deportivo registrado.</p>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha de Ingreso" value={formatDate(athlete.join_date)} />
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha de Registro" value={formatDate(athlete.created_at)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AthleteDetailsDialog;