import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BodyInfoFormProps {
  athleteId: string;
  onSave?: () => void;
}

export const BodyInfoForm: React.FC<BodyInfoFormProps> = ({ athleteId, onSave }) => {
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
    if (athleteId) {
      fetchBodyData();
    }
  }, [athleteId]);

  const fetchBodyData = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_body_info')
        .select('*')
        .eq('athlete_id', athleteId)
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
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('athlete_body_info')
        .select('id')
        .eq('athlete_id', athleteId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const saveData = {
        athlete_id: athleteId,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        size: formData.size,
        blood_type: formData.blood_type,
        allergies: formData.allergies,
        surgeries: formData.surgeries,
        injuries: formData.injuries,
        limitations: formData.limitations,
      };

      if (existing) {
        const { error } = await supabase
          .from('athlete_body_info')
          .update(saveData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('athlete_body_info')
          .insert(saveData);
        if (error) throw error;
      }

      toast({
        title: "Información médica actualizada",
        description: "La información médica ha sido guardada correctamente.",
      });

      if (onSave) onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la información médica. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="70"
          />
        </div>
        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            value={formData.height}
            onChange={(e) => handleInputChange('height', e.target.value)}
            placeholder="175"
          />
        </div>
        <div>
          <Label htmlFor="size">Talla</Label>
          <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione talla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XS">XS</SelectItem>
              <SelectItem value="S">S</SelectItem>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="L">L</SelectItem>
              <SelectItem value="XL">XL</SelectItem>
              <SelectItem value="XXL">XXL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="blood_type">Tipo de Sangre</Label>
          <Select value={formData.blood_type} onValueChange={(value) => handleInputChange('blood_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione tipo" />
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

      <div>
        <Label htmlFor="allergies">Alergias</Label>
        <Textarea
          id="allergies"
          value={formData.allergies}
          onChange={(e) => handleInputChange('allergies', e.target.value)}
          placeholder="Describe cualquier alergia conocida"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="surgeries">Cirugías</Label>
        <Textarea
          id="surgeries"
          value={formData.surgeries}
          onChange={(e) => handleInputChange('surgeries', e.target.value)}
          placeholder="Historial de cirugías"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="injuries">Lesiones</Label>
        <Textarea
          id="injuries"
          value={formData.injuries}
          onChange={(e) => handleInputChange('injuries', e.target.value)}
          placeholder="Lesiones actuales o pasadas"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="limitations">Limitaciones</Label>
        <Textarea
          id="limitations"
          value={formData.limitations}
          onChange={(e) => handleInputChange('limitations', e.target.value)}
          placeholder="Limitaciones físicas o médicas"
          rows={2}
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar Información Médica
      </Button>
    </div>
  );
};
