import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, Eye, Edit, Calendar, Trophy, CreditCard, Filter } from 'lucide-react';
import { useDelegateAthletes, DelegateAthlete } from '@/hooks/useDelegateAthletes';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDelegatePayments } from '@/hooks/useDelegatePayments';
import { formatCurrency, CurrencyCode } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AthleteCategory = Database['public']['Enums']['athlete_category'];
type AthleteStatus = Database['public']['Enums']['athlete_status'];

const categoryLabels: Record<string, string> = {
  escuela: 'Escuela',
  menores: 'Menores',
  transicion: 'Transición',
  prejuvenil: 'Pre-Juvenil',
  juvenil: 'Juvenil',
  mayores: 'Mayores',
  youth: 'Youth',
  junior: 'Junior',
  senior: 'Senior',
  masters: 'Masters',
};

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  injured: 'Lesionado',
  suspended: 'Suspendido',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  injured: 'destructive',
  suspended: 'outline',
};

const DelegateAthletes = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AthleteCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AthleteStatus | 'all'>('all');
  const [selectedAthlete, setSelectedAthlete] = useState<DelegateAthlete | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { currency } = useCurrency();

  const { data: athletes, isLoading } = useDelegateAthletes({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search || undefined,
  });

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return '-';
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || 'AT';
  };

  const openAthleteDetails = (athlete: DelegateAthlete) => {
    setSelectedAthlete(athlete);
    setDetailsOpen(true);
  };

  return (
    <DashboardLayout title="Gestión de Atletas" userRole="delegate">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Atletas del Club
                </CardTitle>
                <CardDescription>
                  Gestiona la información de los atletas
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{athletes?.length ?? 0} atletas</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as AthleteCategory | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AthleteStatus | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Athletes Table */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : athletes && athletes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atleta</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pagos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {athletes.map((athlete) => (
                      <TableRow key={athlete.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={athlete.photo_url || undefined} />
                              <AvatarFallback>
                                {getInitials(athlete.first_name, athlete.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {athlete.first_name} {athlete.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {athlete.email || 'Sin email'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categoryLabels[athlete.category] || athlete.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{calculateAge(athlete.date_of_birth)} años</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[athlete.status] || 'secondary'}>
                            {statusLabels[athlete.status] || athlete.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Ver pagos</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAthleteDetails(athlete)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron atletas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Athlete Details Dialog */}
        <AthleteDetailsDialog
          athlete={selectedAthlete}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          currency={currency}
        />
      </div>
    </DashboardLayout>
  );
};

interface AthleteDetailsDialogProps {
  athlete: DelegateAthlete | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: CurrencyCode;
}

const AthleteDetailsDialog = ({ athlete, open, onOpenChange, currency }: AthleteDetailsDialogProps) => {
  const { data: competitions } = useQuery({
    queryKey: ['athlete-competitions-delegate', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      const { data, error } = await supabase
        .from('competition_registrations')
        .select(`
          id,
          registration_date,
          payment_status,
          competitions (
            id,
            name,
            start_date,
            status
          )
        `)
        .eq('athlete_id', athlete.id)
        .order('registration_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!athlete?.id && open
  });
  const { data: payments } = useDelegatePayments({ athleteId: athlete?.id });

  if (!athlete) return null;

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return '-';
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={athlete.photo_url || undefined} />
              <AvatarFallback>
                {`${athlete.first_name?.charAt(0) ?? ''}${athlete.last_name?.charAt(0) ?? ''}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{athlete.first_name} {athlete.last_name}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {categoryLabels[athlete.category] || athlete.category} • {calculateAge(athlete.date_of_birth)} años
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Información detallada del atleta
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="training">Entrenamientos</TabsTrigger>
            <TabsTrigger value="competitions">Competencias</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Datos Personales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{athlete.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Género:</span>
                    <span>{athlete.gender === 'masculino' ? 'Masculino' : athlete.gender === 'femenino' ? 'Femenino' : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha Nacimiento:</span>
                    <span>
                      {athlete.date_of_birth ? format(parseISO(athlete.date_of_birth), 'd MMM yyyy', { locale: es }) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ingreso:</span>
                    <span>
                      {athlete.created_at ? format(parseISO(athlete.created_at), 'd MMM yyyy', { locale: es }) : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Datos Deportivos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoría:</span>
                    <Badge variant="outline">{categoryLabels[athlete.category] || athlete.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nivel:</span>
                    <span>{athlete.level || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={statusColors[athlete.status] || 'secondary'}>
                      {statusLabels[athlete.status] || athlete.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Contacto de Emergencia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span>{athlete.emergency_contact_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <span>{athlete.emergency_contact_phone || '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Historial de Entrenamientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Vista de entrenamientos en desarrollo
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Competencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competitions && competitions.length > 0 ? (
                  <div className="space-y-2">
                    {competitions.map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <p className="font-medium">{(comp.competitions as { name?: string })?.name || '-'}</p>
                          <p className="text-sm text-muted-foreground">
                            {(comp.competitions as { start_date?: string })?.start_date 
                              ? format(parseISO((comp.competitions as { start_date: string }).start_date), 'd MMM yyyy', { locale: es }) 
                              : '-'}
                          </p>
                        </div>
                        <Badge variant="outline">{(comp.competitions as { status?: string })?.status || '-'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin competencias registradas
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagos de Competencias
                </CardTitle>
                <CardDescription>
                  Solo pagos de competencias e inscripciones (no incluye mensualidades)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments && payments.length > 0 ? (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(payment.transaction_date), 'd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(payment.amount, currency)}</p>
                          <Badge 
                            variant={payment.payment_status === 'paid' ? 'default' : 
                                   payment.payment_status === 'overdue' ? 'destructive' : 'secondary'}
                          >
                            {payment.payment_status === 'paid' ? 'Pagado' :
                             payment.payment_status === 'overdue' ? 'Vencido' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin pagos de competencias registrados
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DelegateAthletes;
