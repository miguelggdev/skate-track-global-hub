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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  Calendar, 
  Shield,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { User } from '@/pages/UserManagement';

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateAge = (dateString: string) => {
    return Math.floor((Date.now() - new Date(dateString).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      coach: 'Entrenador',
      athlete: 'Atleta',
      delegate: 'Delegado',
      leader: 'Líder',
      finance: 'Finanzas',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      coach: 'bg-blue-100 text-blue-800',
      athlete: 'bg-green-100 text-green-800',
      delegate: 'bg-purple-100 text-purple-800',
      leader: 'bg-orange-100 text-orange-800',
      finance: 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
        </DialogHeader>

        {/* Header with user info */}
        <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name} ${user.last_name}`} 
            />
            <AvatarFallback>
              {getInitials(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold">
              {user.first_name} {user.last_name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getRoleColor(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
              <Badge className={user.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {user.blocked ? 'Bloqueado' : 'Activo'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span>{user.email}</span>
              {user.date_of_birth && (
                <span>{calculateAge(user.date_of_birth)} años</span>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5" />
                  <span>Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem 
                    icon={<UserIcon className="h-4 w-4" />} 
                    label="Nombre Completo" 
                    value={`${user.first_name} ${user.last_name}`} 
                  />
                  <InfoItem 
                    icon={<Mail className="h-4 w-4" />} 
                    label="Email" 
                    value={user.email} 
                  />
                  <InfoItem 
                    icon={<Phone className="h-4 w-4" />} 
                    label="Teléfono" 
                    value={user.phone} 
                  />
                  {user.date_of_birth && (
                    <InfoItem 
                      icon={<Calendar className="h-4 w-4" />} 
                      label="Fecha de Nacimiento" 
                      value={formatDate(user.date_of_birth)} 
                    />
                  )}
                </div>
                {user.bio && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Biografía</h4>
                    <p className="text-muted-foreground text-sm">{user.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Información de Cuenta</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem 
                    icon={<Shield className="h-4 w-4" />} 
                    label="Rol" 
                    value={getRoleLabel(user.role)} 
                  />
                  <InfoItem 
                    icon={user.blocked ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />} 
                    label="Estado" 
                    value={user.blocked ? 'Bloqueado' : 'Activo'} 
                  />
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Fecha de Registro" 
                    value={formatDate(user.created_at)} 
                  />
                  <InfoItem 
                    icon={<Clock className="h-4 w-4" />} 
                    label="Última Actualización" 
                    value={formatDate(user.updated_at)} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permisos del Rol</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.role === 'admin' && (
                    <div className="text-sm">
                      <p className="font-medium">Administrador</p>
                      <p className="text-muted-foreground">Acceso completo a todas las funciones del sistema</p>
                    </div>
                  )}
                  {user.role === 'coach' && (
                    <div className="text-sm">
                      <p className="font-medium">Entrenador</p>
                      <p className="text-muted-foreground">Gestión de entrenamientos, atletas y asistencias</p>
                    </div>
                  )}
                  {user.role === 'athlete' && (
                    <div className="text-sm">
                      <p className="font-medium">Atleta</p>
                      <p className="text-muted-foreground">Acceso a su perfil, entrenamientos y estadísticas</p>
                    </div>
                  )}
                  {user.role === 'delegate' && (
                    <div className="text-sm">
                      <p className="font-medium">Delegado</p>
                      <p className="text-muted-foreground">Gestión de competiciones y eventos</p>
                    </div>
                  )}
                  {user.role === 'leader' && (
                    <div className="text-sm">
                      <p className="font-medium">Líder</p>
                      <p className="text-muted-foreground">Supervisión general y gestión del club</p>
                    </div>
                  )}
                  {user.role === 'finance' && (
                    <div className="text-sm">
                      <p className="font-medium">Finanzas</p>
                      <p className="text-muted-foreground">Gestión de transacciones y reportes financieros</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
