import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BodyRecord {
  id: string;
  weight: number | null;
  height: number | null;
  size: string | null;
  blood_type: string | null;
  allergies: string | null;
  surgeries: string | null;
  injuries: string | null;
  limitations: string | null;
  created_at: string;
  updated_at: string;
}

interface BodyRecordsTableProps {
  records: BodyRecord[];
  onEdit: (record: BodyRecord) => void;
  onDelete: (record: BodyRecord) => void;
  loading?: boolean;
}

export const BodyRecordsTable: React.FC<BodyRecordsTableProps> = ({
  records,
  onEdit,
  onDelete,
  loading
}) => {
  const calculateBMI = (weight: number | null, height: number | null): string => {
    if (!weight || !height) return '-';
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return { label: '-', variant: 'outline' };
    
    if (bmiValue < 18.5) return { label: 'Bajo peso', variant: 'outline' };
    if (bmiValue < 25) return { label: 'Normal', variant: 'default' };
    if (bmiValue < 30) return { label: 'Sobrepeso', variant: 'secondary' };
    return { label: 'Obesidad', variant: 'destructive' };
  };

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
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay registros médicos guardados</p>
        <p className="text-sm">Completa el formulario arriba para crear tu primer registro</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Peso (kg)</TableHead>
            <TableHead>Altura (cm)</TableHead>
            <TableHead>IMC</TableHead>
            <TableHead>Talla</TableHead>
            <TableHead>Tipo Sangre</TableHead>
            <TableHead>Observaciones</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const bmi = calculateBMI(record.weight, record.height);
            const bmiCategory = getBMICategory(bmi);
            const hasObservations = record.allergies || record.surgeries || record.injuries || record.limitations;

            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {format(new Date(record.created_at), 'dd/MM/yyyy')}
                  {record.created_at !== record.updated_at && (
                    <div className="text-xs text-muted-foreground">
                      Act: {format(new Date(record.updated_at), 'dd/MM/yyyy')}
                    </div>
                  )}
                </TableCell>
                <TableCell>{record.weight || '-'}</TableCell>
                <TableCell>{record.height || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{bmi}</span>
                    <Badge variant={bmiCategory.variant} className="text-xs">
                      {bmiCategory.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{record.size || '-'}</TableCell>
                <TableCell>
                  {record.blood_type && (
                    <Badge variant="outline">{record.blood_type}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {hasObservations && (
                    <div className="space-y-1">
                      {record.allergies && (
                        <div className="text-xs">
                          <span className="font-medium text-red-600">Alergias:</span> {record.allergies}
                        </div>
                      )}
                      {record.injuries && (
                        <div className="text-xs">
                          <span className="font-medium text-orange-600">Lesiones:</span> {record.injuries}
                        </div>
                      )}
                      {record.surgeries && (
                        <div className="text-xs">
                          <span className="font-medium text-blue-600">Cirugías:</span> {record.surgeries}
                        </div>
                      )}
                      {record.limitations && (
                        <div className="text-xs">
                          <span className="font-medium text-purple-600">Limitaciones:</span> {record.limitations}
                        </div>
                      )}
                    </div>
                  )}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};