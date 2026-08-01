import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Eye, Edit, Trash2, User, Phone, Mail, Calendar, Trophy, Activity, CreditCard, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Athlete } from '@/hooks/useAthletes';
import { EditAthleteDialog } from './EditAthleteDialog';
import AthleteDetailsDialog from './AthleteDetailsDialog';
import { AthleteCardDialog } from './AthleteCardDialog';

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
}

interface AthletesTableProps {
  athletes: Athlete[];
  loading: boolean;
  onActionCompleted?: () => void;
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
}

const AthletesTable = ({ athletes, loading = false, onActionCompleted, pagination, onPageChange }: AthletesTableProps) => {
  const { toast } = useToast();

  const [selected, setSelected] = useState<Athlete | null>(null);
  const [viewAthleteId, setViewAthleteId] = useState<string | null>(null);
  const [editAthlete, setEditAthlete] = useState<Athlete | null>(null);
  const [cardAthleteId, setCardAthleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Utility functions
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateAge = (dateString: string) => {
    return Math.floor((Date.now() - new Date(dateString).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'injured': 'bg-red-100 text-red-800',
      'suspended': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'injured': 'Lesionado',
      'suspended': 'Suspendido',
    };
    return labels[status] || status;
  };

  const getPerformanceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Event handlers
  const openView = (athlete: Athlete) => {
    setViewAthleteId(athlete.id);
  };

  const openEdit = (athlete: Athlete) => {
    setEditAthlete(athlete);
  };

  const openCard = (athlete: Athlete) => {
    setCardAthleteId(athlete.id);
  };

  const openDelete = (athlete: Athlete) => {
    setSelected(athlete);
    setDeleteOpen(true);
  };

  const handleAthleteUpdated = () => {
    setEditAthlete(null);
    if (onActionCompleted) {
      onActionCompleted();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from('athletes')
        .delete()
        .eq('id', selected.id);

      if (error) throw error;

      toast({
        title: "Atleta eliminado",
        description: "El atleta ha sido eliminado correctamente.",
      });

      setDeleteOpen(false);
      onActionCompleted?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'No se pudo eliminar el atleta.',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando atletas...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Lista de Atletas</CardTitle>
        <CardDescription>
          Gestiona la información de todos los atletas registrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Categoría/Nivel</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Rendimiento</TableHead>
                <TableHead>Fecha Ingreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes.map((athlete) => (
                <TableRow key={athlete.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${athlete.first_name} ${athlete.last_name}`} />
                        <AvatarFallback>
                          {getInitials(athlete.first_name ?? '', athlete.last_name ?? '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {athlete.first_name} {athlete.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {athlete.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium capitalize">{athlete.category}</div>
                      <div className="text-sm text-muted-foreground capitalize">{athlete.level}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(athlete.status)}>
                      {getStatusLabel(athlete.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${getPerformanceColor(athlete.performance_score)}`}>
                      {athlete.performance_score ? `${athlete.performance_score}%` : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(athlete.join_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openView(athlete)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCard(athlete)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Ver carnet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const url = `${window.location.origin}/publico/atleta/${athlete.id}`;
                            navigator.clipboard.writeText(url).then(() => {
                              toast({ title: 'Enlace copiado', description: 'Comparte este link con los padres del atleta' });
                            });
                          }}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Compartir con padres
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(athlete)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => openDelete(athlete)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Details Dialog */}
        <AthleteDetailsDialog
          athleteId={viewAthleteId}
          open={!!viewAthleteId}
          onOpenChange={(open) => !open && setViewAthleteId(null)}
        />

        {/* Enhanced Edit Dialog */}
        <EditAthleteDialog
          athlete={editAthlete}
          open={!!editAthlete}
          onOpenChange={(open) => !open && setEditAthlete(null)}
          onAthleteUpdated={handleAthleteUpdated}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar atleta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el atleta{' '}
                <strong>{selected?.first_name} {selected?.last_name}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pagination */}
        {pagination && pagination.totalCount > 0 && (
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} a {' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalCount)} de{' '}
                {pagination.totalCount} atletas
              </div>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => pagination.currentPage > 1 && onPageChange?.(pagination.currentPage - 1)}
                    className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange?.(pageNum)}
                      isActive={pageNum === pagination.currentPage}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => pagination.currentPage < pagination.totalPages && onPageChange?.(pagination.currentPage + 1)}
                    className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Athlete Card Dialog */}
    <AthleteCardDialog
      athleteId={cardAthleteId}
      open={!!cardAthleteId}
      onOpenChange={(open) => !open && setCardAthleteId(null)}
    />
    </>
  );
};

export default AthletesTable;