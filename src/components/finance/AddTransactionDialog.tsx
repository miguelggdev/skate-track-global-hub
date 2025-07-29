import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
    message: "La cantidad debe ser un número válido y no puede ser cero",
  }),
  transaction_type: z.enum(['registration_fee', 'equipment', 'travel', 'coaching', 'other'], {
    required_error: "Selecciona un tipo de transacción",
  }),
  description: z.string().min(1, "La descripción es requerida"),
  transaction_date: z.date({
    required_error: "La fecha de transacción es requerida",
  }),
  payment_status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  due_date: z.date().optional(),
  athlete_id: z.string().optional(),
  team_id: z.string().optional(),
  receipt_url: z.string().url().optional().or(z.literal('')),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
  children: React.ReactNode;
}

const transactionTypeLabels: Record<string, string> = {
  registration_fee: 'Cuota de Inscripción',
  equipment: 'Equipamiento',
  travel: 'Viajes',
  coaching: 'Entrenamiento',
  other: 'Otros',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

export default function AddTransactionDialog({ children }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const createTransactionMutation = useCreateTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date(),
      payment_status: 'pending',
      description: '',
      amount: '',
      receipt_url: '',
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear una transacción",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionData = {
        amount: Number(values.amount),
        transaction_type: values.transaction_type,
        description: values.description,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        payment_status: values.payment_status,
        due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : undefined,
        athlete_id: values.athlete_id || undefined,
        team_id: values.team_id || undefined,
        receipt_url: values.receipt_url || undefined,
        created_by: user.id,
      };

      await createTransactionMutation.mutateAsync(transactionData);
      
      toast({
        title: "Transacción creada",
        description: "La transacción se ha registrado correctamente",
      });
      
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
          <DialogDescription>
            Registra una nueva transacción financiera en el sistema.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">€</span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Ingresa valores positivos para ingresos, negativos para gastos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Transacción *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(transactionTypeLabels).map(([value, label]) => (
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
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Vencimiento (Opcional)</FormLabel>
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
                            <span>Selecciona fecha de vencimiento</span>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Solo requerido para pagos pendientes o facturas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receipt_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Recibo (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://ejemplo.com/recibo.pdf"
                    />
                  </FormControl>
                  <FormDescription>
                    Enlace al recibo o comprobante de la transacción
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createTransactionMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createTransactionMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear Transacción'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}