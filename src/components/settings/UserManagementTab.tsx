import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UsersTable from '@/components/users/UsersTable';
import UserStatsCards from '@/components/users/UserStatsCards';
import AddUserDialog from '@/components/users/AddUserDialog';

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

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

  const handlePasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Se ha enviado un correo para restablecer la contraseña",
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de restablecimiento",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Lista de Usuarios ({users.length})
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuarios..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
};

export default UserManagementTab;