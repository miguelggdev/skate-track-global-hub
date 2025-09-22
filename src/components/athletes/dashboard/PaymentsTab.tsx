import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, ExternalLink, Mail, Phone, User, FileText } from 'lucide-react';
import { useAthleteTransactions } from '@/hooks/useTransactions';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const PaymentsTab = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedType, setSelectedType] = useState<string>('all');
  const { athlete } = useCurrentAthlete();
  const { data: transactions, isLoading } = useAthleteTransactions(athlete?.id);
  const { currency } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mis Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Cargando transacciones...</div>
        </CardContent>
      </Card>
    );
  }

  // Filter transactions by year and type
  const filteredTransactions = transactions?.filter(transaction => {
    const transactionYear = new Date(transaction.transaction_date).getFullYear().toString();
    const yearMatch = transactionYear === selectedYear;
    const typeMatch = selectedType === 'all' || transaction.transaction_type === selectedType;
    return yearMatch && typeMatch;
  }) || [];

  // Get unique years from transactions
  const availableYears = transactions && transactions.length > 0 
    ? [...new Set(transactions.map(t => 
        new Date(t.transaction_date).getFullYear().toString()
      ))]
    : [new Date().getFullYear().toString()];

  const totalPaid = filteredTransactions
    .filter(t => t.payment_status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPending = filteredTransactions
    .filter(t => t.payment_status === 'pending')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mis Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Label className="text-green-700">Total Pagado ({selectedYear})</Label>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid, currency)}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <Label className="text-orange-700">Total Pendiente</Label>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending, currency)}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Label className="text-blue-700">Total Transacciones</Label>
              <div className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Año</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Tipo de Transacción</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(transactionTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay transacciones para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {transactionTypeLabels[transaction.transaction_type] || transaction.transaction_type}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(transaction.payment_status)}>
                        {paymentStatusLabels[transaction.payment_status]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{transaction.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Fecha: {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: es })}</span>
                      {transaction.due_date && (
                        <span>Vencimiento: {format(new Date(transaction.due_date), 'dd/MM/yyyy', { locale: es })}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(transaction.amount), currency)}
                    </div>
                    {transaction.receipt_url && (
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <a href={transaction.receipt_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver Recibo
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Payer Information */}
                {transaction.payer_name && (
                  <div className="mt-4 pt-4 border-t bg-muted/30 -mx-6 px-6 py-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información de quien pagó
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Nombre</Label>
                        <p className="font-medium">{transaction.payer_name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Identificación</Label>
                        <p className="font-medium">{transaction.payer_identification}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{transaction.payer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{transaction.payer_email}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};