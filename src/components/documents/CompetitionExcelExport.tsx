import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Download, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { exportCompetitionRegistrations } from '@/lib/excel-generator';

interface RegistrationRow {
  id: string;
  first_name: string;
  last_name: string;
  identification_number: string | null;
  identification_type: string | null;
  category: string;
  gender: string | null;
  event_name: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export function CompetitionExcelExport() {
  const { toast } = useToast();
  const [competitionId, setCompetitionId] = useState('');
  const [exporting, setExporting] = useState(false);

  // Competitions list
  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name, start_date, location')
        .order('start_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Registrations for selected competition
  const { data: registrations = [], isLoading } = useQuery<RegistrationRow[]>({
    queryKey: ['competition-registrations-export', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select(`
          id,
          athletes (
            first_name, last_name, identification_number, identification_type,
            category, gender, emergency_contact_name, emergency_contact_phone
          ),
          competition_events ( event_name )
        `)
        .eq('competition_id', competitionId);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        first_name: r.athletes?.first_name ?? '',
        last_name: r.athletes?.last_name ?? '',
        identification_number: r.athletes?.identification_number ?? null,
        identification_type: r.athletes?.identification_type ?? null,
        category: r.athletes?.category ?? '',
        gender: r.athletes?.gender ?? null,
        event_name: r.competition_events?.event_name ?? null,
        emergency_contact_name: r.athletes?.emergency_contact_name ?? null,
        emergency_contact_phone: r.athletes?.emergency_contact_phone ?? null,
      }));
    },
    enabled: !!competitionId,
  });

  const selectedComp = competitions.find(c => c.id === competitionId);

  const handleExport = async () => {
    if (!selectedComp || !registrations.length) return;
    setExporting(true);
    try {
      exportCompetitionRegistrations(selectedComp.name, registrations);
      toast({ title: 'Excel generado', description: `${registrations.length} atletas exportados.` });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo generar el Excel.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Planilla de Inscripción — Federación Colombiana
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={competitionId} onValueChange={setCompetitionId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar competencia…" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    <span className="text-muted-foreground ml-1 text-xs">({c.start_date?.slice(0, 10)})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleExport}
              disabled={!competitionId || !registrations.length || exporting}
              className="sm:w-auto"
            >
              {exporting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Exportando…</>
                : <><Download className="h-4 w-4 mr-2" />Descargar Excel</>
              }
            </Button>
          </div>

          {competitionId && (
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              {isLoading
                ? <span className="text-muted-foreground">Cargando inscritos…</span>
                : <span><strong>{registrations.length}</strong> atleta{registrations.length !== 1 ? 's' : ''} inscrito{registrations.length !== 1 ? 's' : ''}</span>
              }
              {selectedComp?.location && (
                <Badge variant="outline">{selectedComp.location}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview table */}
      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Vista previa — {registrations.length} registros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellido</TableHead>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Prueba</TableHead>
                    <TableHead>Emergencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.first_name}</TableCell>
                      <TableCell>{r.last_name}</TableCell>
                      <TableCell className="text-xs">{r.identification_number ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.event_name ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.emergency_contact_phone ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {competitionId && !isLoading && registrations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <Users className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No hay atletas inscritos en esta competencia</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
