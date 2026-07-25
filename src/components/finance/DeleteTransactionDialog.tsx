import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';

interface DeleteTransactionDialogProps {
  transaction: {
    id: string;
    amount: number;
    transaction_type: string;
    description: string;
    athletes?: {
      first_name: string;
      last_name: string;
    };
  };
}

export const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({ transaction }) => {
  const deleteTransactionMutation = useDeleteTransaction();
  const { currency } = useCurrency();

  const handleDelete = async () => {
    await deleteTransactionMutation.mutateAsync(transaction.id);
  };

  const transactionTypeLabels: Record<string, string> = {
    registration_fee: 'Cuota de Inscripción',
    equipment: 'Equipamiento',
    travel: 'Viajes',
    coaching: 'Entrenamiento',
    other: 'Otros',
    mensualidad: 'Mensualidad',
    poliza_deportiva: 'Póliza deportiva',
    anualidad: 'Anualidad',
    psicologia: 'Psicología',
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Esta acción no se puede deshacer. Esto eliminará permanentemente:</p>
            <div className="bg-muted p-3 rounded-md space-y-1">
              <p><strong>Tipo:</strong> {transactionTypeLabels[transaction.transaction_type] || transaction.transaction_type}</p>
              <p><strong>Monto:</strong> {formatCurrency(transaction.amount, currency)}</p>
              <p><strong>Descripción:</strong> {transaction.description}</p>
              {transaction.athletes && (
                <p><strong>Atleta:</strong> {transaction.athletes.first_name} {transaction.athletes.last_name}</p>
              )}
            </div>
            {transaction.transaction_type === 'mensualidad' && (
              <p className="text-orange-600 font-medium">
                ⚠️ El estado de pago del atleta se actualizará automáticamente.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTransactionMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteTransactionMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
