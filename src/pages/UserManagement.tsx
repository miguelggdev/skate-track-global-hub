import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagementHeader from '@/components/users/UserManagementHeader';
import UsersTable from '@/components/users/UsersTable';
import UserStatsCards from '@/components/users/UserStatsCards';
import { ManageUserRolesDialog } from '@/components/users/ManageUserRolesDialog';
import ResetPasswordDialog from '@/components/users/ResetPasswordDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface User {
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
  id_type?: 'Tarjeta de identidad' | 'Cedula de Ciudadania' | 'Pasaporte' | 'Cedula de Extranjeria';
  id_number?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      fetchUsers();
      toast({
        title: "Éxito",
        description: "Usuario eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
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

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Gestión de Usuarios">
      <div className="space-y-6 max-w-none">
        <UserManagementHeader onUserAdded={handleUserAdded} />
        <UserStatsCards users={users} />
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-800">Lista de Usuarios</h3>
            <div className="w-full sm:w-80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
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

          <ManageUserRolesDialog
            user={managingUser}
            open={managingRoleUserId !== null}
            onOpenChange={(open) => !open && setManagingRoleUserId(null)}
            onRoleChanged={fetchUsers}
            currentUserId={currentUser?.id}
          />

          <ResetPasswordDialog
            open={resettingPasswordUser !== null}
            onOpenChange={(open) => !open && setResettingPasswordUser(null)}
            onConfirm={handlePasswordResetConfirm}
            userEmail={resettingPasswordUser?.email || ''}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;