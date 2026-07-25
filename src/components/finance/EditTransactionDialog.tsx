import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUpdateTransaction } from '@/hooks/useTransactions';
import { useDuplicatePaymentCheck } from '@/hooks/useDuplicatePaymentCheck';
import { useFeeSettings } from '@/hooks/useFeeSettings';
import { calculateMonthlyFee, getRegistrationFee } from '@/utils/feeCalculator';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { AlertCircle } from 'lucide-react';

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
    message: "La cantidad debe ser un número válido y no puede ser cero",
  }),
  description: z.string().min(1, "La descripción es requerida"),
  transaction_date: z.date({
    required_error: "La fecha de transacción es requerida",
  }),
  payment_status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  payer_name: z.string().min(1, "El nombre de quien paga es requerido"),
  payer_identification: z.string().min(1, "La identificación es requerida"),
  payer_phone: z.string().min(1, "El teléfono es requerido"),
  payer_email: z.string().email("Ingresa un email válido"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface EditTransactionDialogProps {
  transaction: any;
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({ transaction }) => {
  const [open, setOpen] = useState(false);
  const { data: feeSettings } = useFeeSettings();
  const { currency } = useCurrency();
  const updateTransactionMutation = useUpdateTransaction();
  const [calculatedFee, setCalculatedFee] = useState<{ base: number; increment: number; total: number; applied: boolean } | null>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date(transaction.transaction_date),
      payment_status: transaction.payment_status,
      description: transaction.description,
      amount: transaction.amount.toString(),
      payer_name: transaction.payer_name || '',
      payer_identification: transaction.payer_identification || '',
      payer_phone: transaction.payer_phone || '',
      payer_email: transaction.payer_email || '',
    },
  });

  const watchTransactionDate = form.watch('transaction_date');
  const watchTransactionType = transaction.transaction_type; // Cannot change type

  // Duplicate check (only for mensualidad)
  const { data: duplicateCheck } = useDuplicatePaymentCheck(
    transaction.athlete_id,
    watchTransactionDate,
    watchTransactionType,
    transaction.id // Exclude current transaction
  );

  // Auto-calculate fee when date changes for mensualidad
  useEffect(() => {
    if (!feeSettings) return;

    if (watchTransactionType === 'mensualidad' && watchTransactionDate) {
      const calculated = calculateMonthlyFee(feeSettings, watchTransactionDate);
      setCalculatedFee({
        base: calculated.baseAmount,
        increment: calculated.incrementAmount,
        total: calculated.totalAmount,
        applied: calculated.incrementApplied
      });
      form.setValue('amount', calculated.totalAmount.toString());
    } else if (watchTransactionType === 'registration_fee' && feeSettings) {
      const regFee = getRegistrationFee(feeSettings);
      form.setValue('amount', regFee.toString());
      setCalculatedFee(null);
    } else {
      setCalculatedFee(null);
    }
  }, [watchTransactionDate, feeSettings, watchTransactionType, form]);

  const onSubmit = async (values: TransactionFormValues) => {
    // Duplicate payment validation
    if (duplicateCheck?.hasDuplicate && watchTransactionType === 'mensualidad') {
      toast({
        title: "Pago duplicado detectado",
        description: "Ya existe un pago de mensualidad registrado para este atleta en el mes seleccionado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTransactionMutation.mutateAsync({
        id: transaction.id,
        updates: {
          amount: Number(values.amount),
          description: values.description,
          transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
          payment_status: values.payment_status,
          payer_name: values.payer_name,
          payer_identification: values.payer_identification,
          payer_phone: values.payer_phone,
          payer_email: values.payer_email,
          base_amount: calculatedFee ? calculatedFee.base : undefined,
          increment_applied: calculatedFee ? calculatedFee.applied : false,
          increment_amount: calculatedFee ? calculatedFee.increment : 0,
        },
      });

      toast({
        title: "Transacción actualizada",
        description: "Los cambios se han guardado correctamente",
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Transacción</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la transacción.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Duplicate Payment Warning */}
            {duplicateCheck?.hasDuplicate && watchTransactionType === 'mensualidad' && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <p className="font-medium text-red-900">
                    Ya existe un pago de mensualidad para este atleta en{' '}
                    {new Date(duplicateCheck.existingPayment.transaction_date).toLocaleDateString('es-ES', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-red-800 mt-1">
                    Monto: {formatCurrency(duplicateCheck.existingPayment.amount, currency)}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          readOnly={watchTransactionType === 'mensualidad' || watchTransactionType === 'registration_fee'}
                        />
                      </div>
                    </FormControl>
                    {(watchTransactionType === 'mensualidad' || watchTransactionType === 'registration_fee') && (
                      <FormDescription className="text-xs text-muted-foreground">
                        Monto calculado automáticamente según configuración
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Transacción *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecciona fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fee Calculation Breakdown */}
            {calculatedFee && calculatedFee.applied && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertDescription className="text-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-orange-900">Desglose del Cálculo:</p>
                    <div className="space-y-0.5 text-orange-800">
                      <p>Cuota base: {formatCurrency(calculatedFee.base, currency)}</p>
                      <p>Incremento extraordinario: {formatCurrency(calculatedFee.increment, currency)}</p>
                      <div className="pt-1 border-t border-orange-300 mt-1">
                        <p className="font-semibold">Total: {formatCurrency(calculatedFee.total, currency)}</p>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe la transacción..."
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado del Pago *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(paymentStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Quien Paga</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de quien paga *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nombre completo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payer_identification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificación *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="DNI, NIE, etc."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+34 600 000 000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="email@ejemplo.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={
                  updateTransactionMutation.isPending || 
                  (duplicateCheck?.hasDuplicate && watchTransactionType === 'mensualidad')
                }
              >
                {updateTransactionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
