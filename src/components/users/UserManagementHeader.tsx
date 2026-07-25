import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Download, Upload } from 'lucide-react';
import AddUserDialog from './AddUserDialog';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UserManagementHeaderProps {
  onUserAdded: () => void;
}

const UserManagementHeader = ({ onUserAdded }: UserManagementHeaderProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { isAdmin } = useUserProfile();

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-600 truncate">Administra usuarios del sistema y sus roles</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline"
            className="text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="outline"
            className="text-sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          {isAdmin && (
            <Button 
              className="argon-gradient-blue text-white hover:opacity-90 text-sm"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Usuario
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <AddUserDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onUserAdded={onUserAdded}
        />
      )}
    </div>
  );
};

export default UserManagementHeader;