import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface EditHistoryRecordDialogProps {
  record: HistoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const EditHistoryRecordDialog: React.FC<EditHistoryRecordDialogProps> = ({
  record,
  open,
  onOpenChange,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    if (record) {
      setFormData({
        previous_club: record.previous_club || '',
        years_experience: record.years_experience || 0,
        start_date: record.start_date || '',
        league_date: record.league_date || '',
        federation_date: record.federation_date || '',
        is_league: record.is_league || false,
        is_federated: record.is_federated || false,
      });
    }
  }, [record]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!record) return;

    setLoading(true);
    try {
      const updateData = {
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
        .update(updateData)
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Registro actualizado",
        description: "El historial ha sido actualizado correctamente.",
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Registro de Historial</DialogTitle>
          <DialogDescription>
            Modifica la información del historial de patinaje.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="edit-previous-club">Escuela/Club Anterior</Label>
            <Input 
              id="edit-previous-club" 
              placeholder="Si has pertenecido a otro club"
              value={formData.previous_club}
              onChange={(e) => handleInputChange('previous_club', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="edit-years-experience">Años de Práctica</Label>
            <Input 
              id="edit-years-experience" 
              type="number" 
              placeholder="Años"
              value={formData.years_experience}
              onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-start-date">Fecha de Inicio en el Patinaje</Label>
              <Input 
                id="edit-start-date" 
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-league-date">Fecha de Liga</Label>
              <Input 
                id="edit-league-date" 
                type="date"
                value={formData.league_date}
                onChange={(e) => handleInputChange('league_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-federation-date">Fecha de Federación</Label>
              <Input 
                id="edit-federation-date" 
                type="date"
                value={formData.federation_date}
                onChange={(e) => handleInputChange('federation_date', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-is-league" 
                checked={formData.is_league}
                onCheckedChange={(checked) => handleInputChange('is_league', checked)}
              />
              <Label htmlFor="edit-is-league">¿Ligado a Liga?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-is-federated" 
                checked={formData.is_federated}
                onCheckedChange={(checked) => handleInputChange('is_federated', checked)}
              />
              <Label htmlFor="edit-is-federated">¿Federado?</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};