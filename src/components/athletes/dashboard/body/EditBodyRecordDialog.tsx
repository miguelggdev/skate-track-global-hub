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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface EditBodyRecordDialogProps {
  record: BodyRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const EditBodyRecordDialog: React.FC<EditBodyRecordDialogProps> = ({
  record,
  open,
  onOpenChange,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    if (record) {
      setFormData({
        weight: record.weight?.toString() ?? '',
        height: record.height?.toString() ?? '',
        size: record.size ?? '',
        blood_type: record.blood_type ?? '',
        allergies: record.allergies ?? '',
        surgeries: record.surgeries ?? '',
        injuries: record.injuries ?? '',
        limitations: record.limitations ?? '',
      });
    }
  }, [record]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!record) return;

    setLoading(true);
    try {
      const updateData = {
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
        .update(updateData)
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Registro actualizado",
        description: "La información médica ha sido actualizada correctamente.",
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
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
          <DialogTitle>Editar Registro Médico</DialogTitle>
          <DialogDescription>
            Modifica la información médica de este registro.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-weight">Peso (kg)</Label>
              <Input 
                id="edit-weight" 
                type="number" 
                placeholder="65"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-height">Altura (cm)</Label>
              <Input 
                id="edit-height" 
                type="number" 
                placeholder="170"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-size">Talla</Label>
              <Input 
                id="edit-size" 
                placeholder="M"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-bloodType">Tipo de Sangre</Label>
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

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-allergies">Alergias</Label>
              <Input 
                id="edit-allergies" 
                placeholder="Describe cualquier alergia conocida"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-surgeries">Cirugías</Label>
              <Input 
                id="edit-surgeries" 
                placeholder="Cirugías previas"
                value={formData.surgeries}
                onChange={(e) => handleInputChange('surgeries', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-injuries">Lesiones</Label>
              <Input 
                id="edit-injuries" 
                placeholder="Lesiones importantes"
                value={formData.injuries}
                onChange={(e) => handleInputChange('injuries', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-limitations">Limitaciones Físicas</Label>
              <Input 
                id="edit-limitations" 
                placeholder="Limitaciones o restricciones"
                value={formData.limitations}
                onChange={(e) => handleInputChange('limitations', e.target.value)}
              />
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