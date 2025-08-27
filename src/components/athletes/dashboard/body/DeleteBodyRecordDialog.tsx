import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BodyRecord {
  id: string;
  weight: number | null;
  height: number | null;
  size: string | null;
  blood_type: string | null;
  allergies: string | null;
  surgeries: string | null;
  injuries: string | null;
  limitations: string | null;
  created_at: string;
  updated_at: string;
}

interface DeleteBodyRecordDialogProps {
  record: BodyRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export const DeleteBodyRecordDialog: React.FC<DeleteBodyRecordDialogProps> = ({
  record,
  open,
  onOpenChange,
  onDelete
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!record) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('athlete_body_info')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Registro eliminado",
        description: "El registro médico ha sido eliminado correctamente.",
      });

      onDelete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar registro médico?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el registro médico
            {record && (
              <>
                {" del "}
                <strong>{format(new Date(record.created_at), 'dd/MM/yyyy')}</strong>
              </>
            )}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};