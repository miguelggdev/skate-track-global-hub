import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heart, Plus, RotateCcw, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { BodyRecordsTable } from './body/BodyRecordsTable';
import { EditBodyRecordDialog } from './body/EditBodyRecordDialog';
import { DeleteBodyRecordDialog } from './body/DeleteBodyRecordDialog';

interface BodyRecord {
  id: string;
  athlete_id: string;
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

export const BodyTab = () => {
  const { athlete } = useCurrentAthlete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<BodyRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<BodyRecord | null>(null);
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    size: '',
    blood_type: '',
    allergies: '',
    surgeries: '',
    injuries: '',
    limitations: '',
  });

  useEffect(() => {
    if (athlete?.id) {
      fetchBodyData();
      fetchAllRecords();
    }
  }, [athlete?.id]);

  const fetchBodyData = async () => {
    if (!athlete?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_body_info')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          size: data.size || '',
          blood_type: data.blood_type || '',
          allergies: data.allergies || '',
          surgeries: data.surgeries || '',
          injuries: data.injuries || '',
          limitations: data.limitations || '',
        });
      }
    } catch (error) {
      console.error('Error fetching body data:', error);
    }
  };

  const fetchAllRecords = async () => {
    if (!athlete?.id) return;

    setRecordsLoading(true);
    try {
      const { data, error } = await supabase
        .from('athlete_body_info')
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

  const handleInputChange = (field: string, value: string) => {
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
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        size: formData.size || null,
        blood_type: formData.blood_type || null,
        allergies: formData.allergies || null,
        surgeries: formData.surgeries || null,
        injuries: formData.injuries || null,
        limitations: formData.limitations || null,
      };

      const { error } = await supabase
        .from('athlete_body_info')
        .upsert(saveData, {
          onConflict: 'athlete_id'
        });

      if (error) throw error;

      // Refresh both current data and records list
      await Promise.all([fetchBodyData(), fetchAllRecords()]);

      toast({
        title: "Información médica guardada",
        description: "Tu información médica ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error saving body data:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información médica. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecord = async () => {
    if (!athlete?.id) return;

    // Check if all fields are empty
    const isEmpty = !formData.weight && !formData.height && !formData.size && 
                    !formData.blood_type && !formData.allergies && !formData.surgeries &&
                    !formData.injuries && !formData.limitations;

    if (isEmpty) {
      toast({
        title: "Campos vacíos",
        description: "Completa al menos un campo para crear un nuevo registro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const saveData = {
        athlete_id: athlete.id,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        size: formData.size || null,
        blood_type: formData.blood_type || null,
        allergies: formData.allergies || null,
        surgeries: formData.surgeries || null,
        injuries: formData.injuries || null,
        limitations: formData.limitations || null,
      };

      const { error } = await supabase
        .from('athlete_body_info')
        .insert(saveData);

      if (error) throw error;

      // Clear form and refresh data
      setFormData({
        weight: '',
        height: '',
        size: '',
        blood_type: '',
        allergies: '',
        surgeries: '',
        injuries: '',
        limitations: '',
      });

      await Promise.all([fetchBodyData(), fetchAllRecords()]);

      toast({
        title: "Nuevo registro creado",
        description: "Se ha creado un nuevo registro médico.",
      });
    } catch (error) {
      console.error('Error creating new record:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el nuevo registro. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      weight: '',
      height: '',
      size: '',
      blood_type: '',
      allergies: '',
      surgeries: '',
      injuries: '',
      limitations: '',
    });
  };

  const handleEdit = (record: BodyRecord) => {
    setEditingRecord(record);
  };

  const handleDelete = (record: BodyRecord) => {
    setDeletingRecord(record);
  };

  const handleRecordUpdated = async () => {
    await Promise.all([fetchBodyData(), fetchAllRecords()]);
  };

  const handleRecordDeleted = async () => {
    await Promise.all([fetchBodyData(), fetchAllRecords()]);
  };

  return (
    <div className="space-y-6">
      {/* Current Data Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Información Médica Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                placeholder="65"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                placeholder="170"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="size">Talla</Label>
              <Input 
                id="size" 
                placeholder="M"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bloodType">Tipo de Sangre</Label>
              <Select value={formData.blood_type} onValueChange={(value) => handleInputChange('blood_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div>
              <Label htmlFor="allergies">Alergias</Label>
              <Input 
                id="allergies" 
                placeholder="Describe cualquier alergia conocida"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="surgeries">Cirugías</Label>
              <Input 
                id="surgeries" 
                placeholder="Cirugías previas"
                value={formData.surgeries}
                onChange={(e) => handleInputChange('surgeries', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="injuries">Lesiones</Label>
              <Input 
                id="injuries" 
                placeholder="Lesiones importantes"
                value={formData.injuries}
                onChange={(e) => handleInputChange('injuries', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="limitations">Limitaciones Físicas</Label>
              <Input 
                id="limitations" 
                placeholder="Limitaciones o restricciones"
                value={formData.limitations}
                onChange={(e) => handleInputChange('limitations', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar Información'}
            </Button>
            <Button variant="outline" onClick={handleNewRecord} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Registro
            </Button>
            <Button variant="ghost" onClick={clearForm}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Historial de Registros Médicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BodyRecordsTable
            records={records}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={recordsLoading}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditBodyRecordDialog
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
        onSave={handleRecordUpdated}
      />

      {/* Delete Dialog */}
      <DeleteBodyRecordDialog
        record={deletingRecord}
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
        onDelete={handleRecordDeleted}
      />
    </div>
  );
};