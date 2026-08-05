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
  Zap,
  Nfc
} from 'lucide-react';
import { NFCTagManager } from '@/components/athletes/NFCTagManager';
import { format } from 'date-fns';
import { useAthleteDetails, AthleteDetails } from '@/hooks/useAthleteDetails';
import { BodyInfoForm } from '@/components/athletes/forms/BodyInfoForm';
import { StudiesInfoForm } from '@/components/athletes/forms/StudiesInfoForm';
import { EquipmentInfoForm } from '@/components/athletes/forms/EquipmentInfoForm';
import { HistoryInfoForm } from '@/components/athletes/forms/HistoryInfoForm';

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
  const { data: athlete, isLoading, error, refetch } = useAthleteDetails(athleteId);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateAge = (dateString: string) => {
    return Math.floor((Date.now() - new Date(dateString).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
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
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 h-auto gap-0.5">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="family">Familia</TabsTrigger>
            <TabsTrigger value="medical">Médico</TabsTrigger>
            <TabsTrigger value="studies">Estudios</TabsTrigger>
            <TabsTrigger value="equipment">Equipo</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="nfc" className="gap-1">
              <Nfc className="h-3.5 w-3.5" /> NFC
            </TabsTrigger>
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
                <BodyInfoForm athleteId={athlete.id} onSave={refetch} />
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
                <StudiesInfoForm athleteId={athlete.id} onSave={refetch} />
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
                <EquipmentInfoForm athleteId={athlete.id} onSave={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* NFC Tab */}
          <TabsContent value="nfc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Nfc className="h-5 w-5" />
                  <span>Tag NFC del Casco</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NFCTagManager
                  athleteId={athlete.id}
                  athleteName={`${athlete.first_name} ${athlete.last_name}`}
                  checkinToken={null}
                />
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
                <HistoryInfoForm athleteId={athlete.id} onSave={refetch} />

                <Separator className="my-6" />

                <div className="mt-4">
                  <h4 className="font-medium mb-3">Información General</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha de Ingreso" value={formatDate(athlete.join_date)} />
                    <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha de Registro" value={formatDate(athlete.created_at)} />
                  </div>
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