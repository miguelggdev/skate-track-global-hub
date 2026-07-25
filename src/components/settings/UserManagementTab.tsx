import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import UsersTable from '@/components/users/UsersTable';
import UserStatsCards from '@/components/users/UserStatsCards';
import AddUserDialog from '@/components/users/AddUserDialog';
import { ManageUserRolesDialog } from '@/components/users/ManageUserRolesDialog';
import ResetPasswordDialog from '@/components/users/ResetPasswordDialog';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  created_at: string;
  updated_at: string;
  blocked?: boolean;
}

const UserManagementTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [managingRoleUserId, setManagingRoleUserId] = useState<string | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { isAdmin } = useUserProfile();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = () => {
    fetchUsers();
    toast({
      title: "Éxito",
      description: "Usuario creado exitosamente",
    });
  };

  const handleUserUpdated = () => {
    fetchUsers();
    toast({
      title: "Éxito",
      description: "Usuario actualizado exitosamente",
    });
  };

  const handleUserDeleted = async (userId: string) => {
    try {
      // Prevent self-deletion
      if (userId === currentUser?.id) {
        toast({
          title: "Error",
          description: "No puedes eliminar tu propio usuario",
          variant: "destructive",
        });
        return;
      }

      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error al conectar con el servidor');
      }

      if (data?.error) {
        console.error('Delete user error:', data.error);
        throw new Error(data.error);
      }
      
      fetchUsers();
      toast({
        title: "Éxito",
        description: "Usuario eliminado exitosamente",
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleUserBlocked = async (userId: string, blocked: boolean) => {
    try {
      // Block/unblock in auth system
      if (blocked) {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '24h'
        });
        if (error) throw error;
      }
      
      fetchUsers();
      toast({
        title: "Éxito",
        description: blocked ? "Usuario desbloqueado exitosamente" : "Usuario bloqueado exitosamente",
      });
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async (userId: string) => {
    if (!isAdmin) {
      toast({
        title: "Error",
        description: "Solo los administradores pueden restablecer contraseñas",
        variant: "destructive",
      });
      return;
    }

    const user = users.find(u => u.id === userId);
    if (user) {
      setResettingPasswordUser(user);
    }
  };

  const handlePasswordResetConfirm = async (newPassword: string) => {
    if (!resettingPasswordUser) return;

    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: resettingPasswordUser.id,
          newPassword: newPassword,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error al conectar con el servidor');
      }

      if (data?.error) {
        console.error('Password reset error:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: "Éxito",
        description: "Contraseña actualizada exitosamente",
      });

      setResettingPasswordUser(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    }
  };

  const handleRoleManage = (userId: string) => {
    setManagingRoleUserId(userId);
  };

  const managingUser = users.find(u => u.id === managingRoleUserId) || null;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="argon-card">
        <CardHeader>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-800">Gestión de Usuarios</CardTitle>
              <CardDescription>Administra usuarios del sistema y sus roles</CardDescription>
            </div>
            <Button 
              className="argon-gradient-blue text-white hover:opacity-90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Usuario
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* User Stats */}
      <UserStatsCards users={users} />
      
      {/* Search and Filter */}
      <Card className="argon-card">
        <CardHeader>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Lista de Usuarios ({filteredUsers.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="athlete">Athlete</SelectItem>
                  <SelectItem value="delegate">Delegate</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Users Table */}
      <UsersTable 
        users={filteredUsers}
        loading={loading}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
        onUserBlocked={handleUserBlocked}
        onPasswordReset={handlePasswordReset}
        onRoleManage={handleRoleManage}
        isAdmin={isAdmin}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onUserAdded={handleUserAdded}
      />

      {/* Manage User Roles Dialog */}
      <ManageUserRolesDialog
        user={managingUser}
        open={managingRoleUserId !== null}
        onOpenChange={(open) => !open && setManagingRoleUserId(null)}
        onRoleChanged={fetchUsers}
        currentUserId={currentUser?.id}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resettingPasswordUser !== null}
        onOpenChange={(open) => !open && setResettingPasswordUser(null)}
        onConfirm={handlePasswordResetConfirm}
        userEmail={resettingPasswordUser?.email || ''}
      />
    </div>
  );
};

export default UserManagementTab;