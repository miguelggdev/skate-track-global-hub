
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Athlete {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category: string;
  level: string;
  join_date: string;
  status: string;
  performance_score?: number;
}

interface AthletesTableProps {
  athletes: Athlete[];
  loading?: boolean;
  onActionCompleted?: () => void;
}

const AthletesTable = ({ athletes, loading = false, onActionCompleted }: AthletesTableProps) => {
  const { toast } = useToast();

  const [selected, setSelected] = useState<Athlete | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    performance_score: 0,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'injured': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-blue-600';
    if (performance >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const openView = (athlete: Athlete) => {
    setSelected(athlete);
    setViewOpen(true);
  };

  const openEdit = (athlete: Athlete) => {
    setSelected(athlete);
    setEditData({
      first_name: athlete.first_name || '',
      last_name: athlete.last_name || '',
      email: athlete.email || '',
      performance_score: Number(athlete.performance_score || 0),
    });
    setEditOpen(true);
  };

  const openDelete = (athlete: Athlete) => {
    setSelected(athlete);
    setDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from('athletes')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email,
          performance_score: Number(editData.performance_score) || 0,
        })
        .eq('id', selected.id);

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Atleta actualizado correctamente' });
      setEditOpen(false);
      onActionCompleted?.();
    } catch (e: any) {
      console.error('Error updating athlete:', e);
      toast({ title: 'Error', description: 'No se pudo actualizar el atleta', variant: 'destructive' });
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

      toast({ title: 'Eliminado', description: 'Atleta eliminado correctamente' });
      setDeleteOpen(false);
      onActionCompleted?.();
    } catch (e: any) {
      console.error('Error deleting athlete:', e);
      toast({ title: 'Error', description: 'No se pudo eliminar el atleta', variant: 'destructive' });
    }
  };

  return (
    <Card className="xl:col-span-2 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Athletes List</CardTitle>
        <CardDescription>Manage your athletes and their information</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px] px-6">Athlete</TableHead>
                <TableHead className="min-w-[100px] px-4">Category</TableHead>
                <TableHead className="min-w-[120px] px-4">Level</TableHead>
                <TableHead className="min-w-[100px] px-4">Status</TableHead>
                <TableHead className="min-w-[120px] px-4">Performance</TableHead>
                <TableHead className="min-w-[80px] text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="ml-2">Loading athletes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : athletes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No athletes found. Add your first athlete to get started.
                  </TableCell>
                </TableRow>
              ) : (
                athletes.map((athlete) => {
                  const fullName = athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : 'Unknown';
                  const email = athlete.email || 'No email';
                  const performanceScore = athlete.performance_score || 0;
                  
                  return (
                    <TableRow key={athlete.id}>
                      <TableCell className="px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">👤</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 truncate">{fullName}</p>
                            <p className="text-sm text-gray-600 truncate">{email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-sm capitalize">{athlete.category}</TableCell>
                      <TableCell className="px-4 text-sm capitalize">{athlete.level}</TableCell>
                      <TableCell className="px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize ${getStatusColor(athlete.status)}`}>
                          {athlete.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className={`font-semibold text-sm ${getPerformanceColor(performanceScore)}`}>
                          {performanceScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(athlete)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(athlete)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => openDelete(athlete)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* View Details Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Athlete details</DialogTitle>
              <DialogDescription>Información del atleta seleccionado</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-3">
                <div>
                  <Label>Nombre</Label>
                  <div className="mt-1">{`${selected.first_name || ''} ${selected.last_name || ''}`.trim() || 'Sin nombre'}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="mt-1">{selected.email || 'Sin email'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoría</Label>
                    <div className="mt-1 capitalize">{selected.category}</div>
                  </div>
                  <div>
                    <Label>Nivel</Label>
                    <div className="mt-1 capitalize">{selected.level}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estado</Label>
                    <div className="mt-1 capitalize">{selected.status}</div>
                  </div>
                  <div>
                    <Label>Performance</Label>
                    <div className="mt-1">{Number(selected.performance_score || 0)}%</div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar atleta</DialogTitle>
              <DialogDescription>Actualiza los datos básicos del atleta</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Nombre</Label>
                <Input id="first_name" value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Apellido</Label>
                <Input id="last_name" value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="performance">Performance (%)</Label>
                <Input id="performance" type="number" min={0} max={100} value={editData.performance_score}
                  onChange={(e) => setEditData({ ...editData, performance_score: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar atleta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el registro del atleta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Athlete {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category: string;
  level: string;
  join_date: string;
  status: string;
  performance_score?: number;
}

interface AthletesTableProps {
  athletes: Athlete[];
  loading?: boolean;
  onActionCompleted?: () => void;
}

const AthletesTable = ({ athletes, loading = false, onActionCompleted }: AthletesTableProps) => {
  const { toast } = useToast();

  const [selected, setSelected] = useState<Athlete | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    performance_score: 0,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'injured': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-blue-600';
    if (performance >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const openView = (athlete: Athlete) => {
    setSelected(athlete);
    setViewOpen(true);
  };

  const openEdit = (athlete: Athlete) => {
    setSelected(athlete);
    setEditData({
      first_name: athlete.first_name || '',
      last_name: athlete.last_name || '',
      email: athlete.email || '',
      performance_score: Number(athlete.performance_score || 0),
    });
    setEditOpen(true);
  };

  const openDelete = (athlete: Athlete) => {
    setSelected(athlete);
    setDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from('athletes')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email,
          performance_score: Number(editData.performance_score) || 0,
        })
        .eq('id', selected.id);

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Atleta actualizado correctamente' });
      setEditOpen(false);
      onActionCompleted?.();
    } catch (e: any) {
      console.error('Error updating athlete:', e);
      toast({ title: 'Error', description: 'No se pudo actualizar el atleta', variant: 'destructive' });
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

      toast({ title: 'Eliminado', description: 'Atleta eliminado correctamente' });
      setDeleteOpen(false);
      onActionCompleted?.();
    } catch (e: any) {
      console.error('Error deleting athlete:', e);
      toast({ title: 'Error', description: 'No se pudo eliminar el atleta', variant: 'destructive' });
    }
  };

  return (
    <Card className="xl:col-span-2 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Athletes List</CardTitle>
        <CardDescription>Manage your athletes and their information</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px] px-6">Athlete</TableHead>
                <TableHead className="min-w-[100px] px-4">Category</TableHead>
                <TableHead className="min-w-[120px] px-4">Level</TableHead>
                <TableHead className="min-w-[100px] px-4">Status</TableHead>
                <TableHead className="min-w-[120px] px-4">Performance</TableHead>
                <TableHead className="min-w-[80px] text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="ml-2">Loading athletes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : athletes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No athletes found. Add your first athlete to get started.
                  </TableCell>
                </TableRow>
              ) : (
                athletes.map((athlete) => {
                  const fullName = athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : 'Unknown';
                  const email = athlete.email || 'No email';
                  const performanceScore = athlete.performance_score || 0;
                  
                  return (
                    <TableRow key={athlete.id}>
                      <TableCell className="px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">👤</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 truncate">{fullName}</p>
                            <p className="text-sm text-gray-600 truncate">{email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-sm capitalize">{athlete.category}</TableCell>
                      <TableCell className="px-4 text-sm capitalize">{athlete.level}</TableCell>
                      <TableCell className="px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize ${getStatusColor(athlete.status)}`}>
                          {athlete.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className={`font-semibold text-sm ${getPerformanceColor(performanceScore)}`}>
                          {performanceScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(athlete)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(athlete)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => openDelete(athlete)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* View Details Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Athlete details</DialogTitle>
              <DialogDescription>Información del atleta seleccionado</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-3">
                <div>
                  <Label>Nombre</Label>
                  <div className="mt-1">{`${selected.first_name || ''} ${selected.last_name || ''}`.trim() || 'Sin nombre'}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="mt-1">{selected.email || 'Sin email'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoría</Label>
                    <div className="mt-1 capitalize">{selected.category}</div>
                  </div>
                  <div>
                    <Label>Nivel</Label>
                    <div className="mt-1 capitalize">{selected.level}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estado</Label>
                    <div className="mt-1 capitalize">{selected.status}</div>
                  </div>
                  <div>
                    <Label>Performance</Label>
                    <div className="mt-1">{Number(selected.performance_score || 0)}%</div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar atleta</DialogTitle>
              <DialogDescription>Actualiza los datos básicos del atleta</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Nombre</Label>
                <Input id="first_name" value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Apellido</Label>
                <Input id="last_name" value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="performance">Performance (%)</Label>
                <Input id="performance" type="number" min={0} max={100} value={editData.performance_score}
                  onChange={(e) => setEditData({ ...editData, performance_score: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar atleta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el registro del atleta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default AthletesTable;

            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default AthletesTable;
