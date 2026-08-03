import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Plus, Download, Filter, AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useDelegatePayments, useCreateDelegatePayment, DELEGATE_TRANSACTION_TYPES, DelegatePayment } from '@/hooks/useDelegatePayments';
import { useDelegateAthletes } from '@/hooks/useDelegateAthletes';
import { useCompetitions } from '@/hooks/useCompetitions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { Database } from '@/integrations/supabase/types';

type PaymentStatus = Database['public']['Enums']['transaction_status'];
type TransactionType = Database['public']['Enums']['transaction_type'];

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

const statusColors: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'outline',
};

const DelegatePayments = () => {
  const { currency } = useCurrency();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: payments, isLoading } = useDelegatePayments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const pendingPayments = payments?.filter(p => p.payment_status === 'pending' || p.payment_status === 'overdue') ?? [];
  const completedPayments = payments?.filter(p => p.payment_status === 'paid') ?? [];
  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCompleted = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const getTransactionTypeLabel = (type: TransactionType): string => {
    const found = DELEGATE_TRANSACTION_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  return (
    <DashboardLayout title="Pagos de Competencias" userRole="delegate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Pagos de Competencias
            </h2>
            <p className="text-muted-foreground">
              Gestiona pagos de competencias, inscripciones y seguros
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments.length}</div>
              <p className="text-sm text-muted-foreground">{formatCurrency(totalPending, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedPayments.length}</div>
              <p className="text-sm text-muted-foreground">{formatCurrency(totalCompleted, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {payments?.filter(p => p.payment_status === 'overdue').length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Total Recaudado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalCompleted, currency)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>
                  Pagos de competencias e inscripciones (no incluye mensualidades)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus | 'all')}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : payments && payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pagado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(parseISO(payment.transaction_date), 'd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {payment.athletes ? 
                          `${payment.athletes.first_name ?? ''} ${payment.athletes.last_name ?? ''}`.trim() || 'N/A' :
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getTransactionTypeLabel(payment.transaction_type)}</p>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount, currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[payment.payment_status]}>
                          {statusLabels[payment.payment_status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.payer_name || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay pagos registrados</p>
                <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Payment Dialog */}
        <AddPaymentDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} currency={currency} />
      </div>
    </DashboardLayout>
  );
};

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
}

const AddPaymentDialog = ({ open, onOpenChange, currency }: AddPaymentDialogProps) => {
  const { data: athletes } = useDelegateAthletes();
  const { data: competitions } = useCompetitions();
  const createPayment = useCreateDelegatePayment();

  const [formData, setFormData] = useState({
    athlete_id: '',
    transaction_type: '' as TransactionType,
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_status: 'paid' as PaymentStatus,
    description: '',
    due_date: '',
    payer_name: '',
    payer_phone: '',
    payer_email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.athlete_id || !formData.transaction_type || !formData.amount) {
      return;
    }

    await createPayment.mutateAsync({
      athlete_id: formData.athlete_id,
      transaction_type: formData.transaction_type,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
      payment_status: formData.payment_status,
      description: formData.description || getTransactionTypeLabel(formData.transaction_type),
      due_date: formData.due_date || undefined,
      payer_name: formData.payer_name || undefined,
      payer_phone: formData.payer_phone || undefined,
      payer_email: formData.payer_email || undefined,
    });

    onOpenChange(false);
    setFormData({
      athlete_id: '',
      transaction_type: '' as TransactionType,
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_status: 'paid',
      description: '',
      due_date: '',
      payer_name: '',
      payer_phone: '',
      payer_email: '',
    });
  };

  const getTransactionTypeLabel = (type: TransactionType): string => {
    const found = DELEGATE_TRANSACTION_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra un pago de competencia, inscripción o seguro
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="athlete">Atleta *</Label>
              <Select 
                value={formData.athlete_id} 
                onValueChange={(v) => setFormData({ ...formData, athlete_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar atleta" />
                </SelectTrigger>
                <SelectContent>
                  {athletes?.map(athlete => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.first_name} {athlete.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Concepto *</Label>
              <Select 
                value={formData.transaction_type} 
                onValueChange={(v) => setFormData({ ...formData, transaction_type: v as TransactionType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de pago" />
                </SelectTrigger>
                <SelectContent>
                  {DELEGATE_TRANSACTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto ({currency}) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Pago *</Label>
              <Input
                id="date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select 
                value={formData.payment_status} 
                onValueChange={(v) => setFormData({ ...formData, payment_status: v as PaymentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha Vencimiento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del pago..."
              />
            </div>

            <div className="col-span-2">
              <h4 className="font-medium mb-2">Datos del Pagador (Opcional)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payer_name">Nombre</Label>
                  <Input
                    id="payer_name"
                    value={formData.payer_name}
                    onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payer_phone">Teléfono</Label>
                  <Input
                    id="payer_phone"
                    value={formData.payer_phone}
                    onChange={(e) => setFormData({ ...formData, payer_phone: e.target.value })}
                    placeholder="Teléfono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payer_email">Email</Label>
                  <Input
                    id="payer_email"
                    type="email"
                    value={formData.payer_email}
                    onChange={(e) => setFormData({ ...formData, payer_email: e.target.value })}
                    placeholder="Email"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? 'Guardando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DelegatePayments;
