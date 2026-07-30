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

interface HistoryRecord {
  id: string;
  athlete_id: string;
  previous_club: string | null;
  years_experience: number | null;
  start_date: string | null;
  league_date: string | null;
  federation_date: string | null;
  is_league: boolean | null;
  is_federated: boolean | null;
  created_at: string;
  updated_at: string;
}

interface DeleteHistoryRecordDialogProps {
  record: HistoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export const DeleteHistoryRecordDialog: React.FC<DeleteHistoryRecordDialogProps> = ({
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
        .from('athlete_history')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Registro eliminado",
        description: "El registro de historial ha sido eliminado correctamente.",
      });

      onDelete();
      onOpenChange(false);
    } catch (error) {
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
          <AlertDialogTitle>¿Eliminar registro de historial?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el registro de historial
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