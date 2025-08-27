import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryRecord {
  id: string;
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

interface HistoryRecordsTableProps {
  records: HistoryRecord[];
  onEdit: (record: HistoryRecord) => void;
  onDelete: (record: HistoryRecord) => void;
  loading?: boolean;
}

export const HistoryRecordsTable: React.FC<HistoryRecordsTableProps> = ({
  records,
  onEdit,
  onDelete,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted-foreground">Cargando registros...</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay registros de historial guardados</p>
        <p className="text-sm">Completa el formulario arriba para crear tu primer registro</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha Registro</TableHead>
            <TableHead>Club Anterior</TableHead>
            <TableHead>Años Experiencia</TableHead>
            <TableHead>Fecha Inicio</TableHead>
            <TableHead>Fecha Liga</TableHead>
            <TableHead>Fecha Federación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {format(new Date(record.created_at), 'dd/MM/yyyy')}
                {record.created_at !== record.updated_at && (
                  <div className="text-xs text-muted-foreground">
                    Act: {format(new Date(record.updated_at), 'dd/MM/yyyy')}
                  </div>
                )}
              </TableCell>
              <TableCell>{record.previous_club || '-'}</TableCell>
              <TableCell>{record.years_experience || 0}</TableCell>
              <TableCell>
                {record.start_date ? format(new Date(record.start_date), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell>
                {record.league_date ? format(new Date(record.league_date), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell>
                {record.federation_date ? format(new Date(record.federation_date), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {record.is_league && (
                    <Badge variant="default" className="text-xs">Liga</Badge>
                  )}
                  {record.is_federated && (
                    <Badge variant="secondary" className="text-xs">Federado</Badge>
                  )}
                  {!record.is_league && !record.is_federated && (
                    <span className="text-muted-foreground text-xs">Sin estado</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(record)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(record)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};