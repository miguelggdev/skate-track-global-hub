import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Trophy, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { HistoryRecordsTable } from './history/HistoryRecordsTable';
import { EditHistoryRecordDialog } from './history/EditHistoryRecordDialog';
import { DeleteHistoryRecordDialog } from './history/DeleteHistoryRecordDialog';

interface HistoryRecord {
  id: string;
  athlete_id: string;
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

export const HistoryTab = () => {
  const { athlete } = useCurrentAthlete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<HistoryRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<HistoryRecord | null>(null);
  const [formData, setFormData] = useState({
    previous_club: '',
    years_experience: 0,
    start_date: '',
    league_date: '',
    federation_date: '',
    is_league: false,
    is_federated: false,
  });

  useEffect(() => {
    if (athlete?.id) {
      fetchHistoryData();
      fetchAllRecords();
    }
  }, [athlete?.id]);

  const fetchHistoryData = async () => {
    if (!athlete?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_history')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          previous_club: data.previous_club || '',
          years_experience: data.years_experience || 0,
          start_date: data.start_date || '',
          league_date: data.league_date || '',
          federation_date: data.federation_date || '',
          is_league: data.is_league || false,
          is_federated: data.is_federated || false,
        });
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
    }
  };

  const fetchAllRecords = async () => {
    if (!athlete?.id) return;

    setRecordsLoading(true);
    try {
      const { data, error } = await supabase
        .from('athlete_history')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching all records:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros históricos.",
        variant: "destructive",
      });
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!athlete?.id) {
      toast({
        title: "Error",
        description: "No se encontró información del deportista.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const saveData = {
        athlete_id: athlete.id,
        previous_club: formData.previous_club || null,
        years_experience: formData.years_experience,
        start_date: formData.start_date || null,
        league_date: formData.league_date || null,
        federation_date: formData.federation_date || null,
        is_league: formData.is_league,
        is_federated: formData.is_federated,
      };

      const { error } = await supabase
        .from('athlete_history')
        .insert(saveData);

      if (error) throw error;

      // Refresh both current data and records list
      await Promise.all([fetchHistoryData(), fetchAllRecords()]);

      toast({
        title: "Historial guardado",
        description: "Tu información de historial ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error saving history data:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el historial. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: HistoryRecord) => {
    setEditingRecord(record);
  };

  const handleDelete = (record: HistoryRecord) => {
    setDeletingRecord(record);
  };

  const handleRecordUpdated = async () => {
    await Promise.all([fetchHistoryData(), fetchAllRecords()]);
  };

  const handleRecordDeleted = async () => {
    await Promise.all([fetchHistoryData(), fetchAllRecords()]);
  };

  return (
    <div className="space-y-6">
      {/* Current Data Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Historial de Patinaje Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="previous_club">Escuela/Club Anterior</Label>
              <Input 
                id="previous_club" 
                placeholder="Si has pertenecido a otro club"
                value={formData.previous_club}
                onChange={(e) => handleInputChange('previous_club', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="yearsExperience">Años de Práctica</Label>
              <Input 
                id="yearsExperience" 
                type="number" 
                placeholder="Años"
                value={formData.years_experience}
                onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_date">Fecha de Inicio en el Patinaje</Label>
              <Input 
                id="start_date" 
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="league_date">Fecha de Liga</Label>
              <Input 
                id="league_date" 
                type="date"
                value={formData.league_date}
                onChange={(e) => handleInputChange('league_date', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="federation_date">Fecha de Federación</Label>
              <Input 
                id="federation_date" 
                type="date"
                value={formData.federation_date}
                onChange={(e) => handleInputChange('federation_date', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isLeague" 
                checked={formData.is_league}
                onCheckedChange={(checked) => handleInputChange('is_league', checked)}
              />
              <Label htmlFor="isLeague">¿Ligado a Liga?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isFederated" 
                checked={formData.is_federated}
                onCheckedChange={(checked) => handleInputChange('is_federated', checked)}
              />
              <Label htmlFor="isFederated">¿Federado?</Label>
            </div>
          </div>
          
          <div className="flex pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar Historial'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Historial de Registros de Patinaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryRecordsTable
            records={records}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={recordsLoading}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditHistoryRecordDialog
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
        onSave={handleRecordUpdated}
      />

      {/* Delete Dialog */}
      <DeleteHistoryRecordDialog
        record={deletingRecord}
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
        onDelete={handleRecordDeleted}
      />
    </div>
  );
};