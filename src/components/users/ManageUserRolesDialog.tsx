import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ManageUserRolesDialogProps {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChanged: () => void;
  currentUserId?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  athlete: 'Atleta',
  delegate: 'Delegado',
  leader: 'Directivo',
  finance: 'Finanzas'
};

export function ManageUserRolesDialog({ user, open, onOpenChange, onRoleChanged, currentUserId }: ManageUserRolesDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && user) {
      setSelectedRole(user.role);
    }
    onOpenChange(newOpen);
  };

  const handleRoleChange = async () => {
    if (!user || !selectedRole) return;

    // Prevent users from changing their own role
    if (currentUserId === user.id) {
      toast({
        title: 'Error',
        description: 'No puedes cambiar tu propio rol',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Role lives exclusively in user_roles — delete existing and insert the new one
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: user.id, role: selectedRole as any }]);

      if (insertError) throw insertError;

      toast({
        title: 'Rol actualizado',
        description: `El rol de ${user.first_name} ${user.last_name} ha sido actualizado a ${ROLE_LABELS[selectedRole]}`,
      });

      onRoleChanged();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el rol',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestionar Rol de Usuario</DialogTitle>
          <DialogDescription>
            Cambiar el rol para {user.first_name} {user.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Usuario</Label>
            <div className="text-sm">
              <p className="font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rol Actual</Label>
            <div>
              <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-select">Nuevo Rol</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="coach">Entrenador</SelectItem>
                <SelectItem value="athlete">Atleta</SelectItem>
                <SelectItem value="delegate">Delegado</SelectItem>
                <SelectItem value="leader">Directivo</SelectItem>
                <SelectItem value="finance">Finanzas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRoleChange} 
            disabled={loading || selectedRole === user.role || !selectedRole}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
