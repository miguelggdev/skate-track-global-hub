import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Eye, Shield, Lock, Unlock, KeyRound, User as UserIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EditUserDialog from './EditUserDialog';
import { User } from '@/pages/UserManagement';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onUserUpdated: () => void;
  onUserDeleted: (userId: string) => void;
  onUserBlocked: (userId: string, blocked: boolean) => void;
  onPasswordReset: (email: string) => void;
}

const UsersTable = ({ users, loading, onUserUpdated, onUserDeleted, onUserBlocked, onPasswordReset }: UsersTableProps) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
      coach: { label: 'Entrenador', color: 'bg-blue-100 text-blue-800' },
      athlete: { label: 'Atleta', color: 'bg-green-100 text-green-800' },
      delegate: { label: 'Delegado', color: 'bg-purple-100 text-purple-800' },
      leader: { label: 'Líder', color: 'bg-orange-100 text-orange-800' },
      finance: { label: 'Finanzas', color: 'bg-yellow-100 text-yellow-800' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="argon-card">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="argon-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Lista de Usuarios ({users.length})
          </CardTitle>
          <CardDescription>
            Gestiona los usuarios del sistema y sus roles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px] px-6">Usuario</TableHead>
                  <TableHead className="min-w-[120px] px-4">Rol</TableHead>
                  <TableHead className="min-w-[100px] px-4">Estado</TableHead>
                  <TableHead className="min-w-[100px] px-4">Teléfono</TableHead>
                  <TableHead className="min-w-[120px] px-4">Fecha Registro</TableHead>
                  <TableHead className="min-w-[80px] text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-6">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                           {user.avatar_url ? (
                             <img 
                               src={user.avatar_url} 
                               alt={`${user.first_name} ${user.last_name}`}
                               className="w-full h-full object-cover"
                             />
                           ) : (
                             <UserIcon className="h-5 w-5 text-muted-foreground" />
                           )}
                         </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge className={user.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {user.blocked ? 'Bloqueado' : 'Activo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-sm">
                      {user.phone || 'No registrado'}
                    </TableCell>
                    <TableCell className="px-4 text-sm">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('Ver detalles', user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Gestionar roles', user.id)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Gestionar Roles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUserBlocked(user.id, user.blocked || false)}>
                            {user.blocked ? (
                              <>
                                <Unlock className="mr-2 h-4 w-4" />
                                Desbloquear Usuario
                              </>
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Bloquear Usuario
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPasswordReset(user.email)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Restablecer Contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onUserUpdated={onUserUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario {deletingUser?.first_name} {deletingUser?.last_name} será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingUser) {
                  onUserDeleted(deletingUser.id);
                  setDeletingUser(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersTable;