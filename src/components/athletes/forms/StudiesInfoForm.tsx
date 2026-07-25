import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StudiesInfoFormProps {
  athleteId: string;
  onSave?: () => void;
}

export const StudiesInfoForm: React.FC<StudiesInfoFormProps> = ({ athleteId, onSave }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    education_level: '',
    current_grade: '',
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
  });

  useEffect(() => {
    if (athleteId) {
      fetchStudiesData();
    }
  }, [athleteId]);

  const fetchStudiesData = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_studies')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          education_level: data.education_level || '',
          current_grade: data.current_grade || '',
          school_name: data.school_name || '',
          school_address: data.school_address || '',
          school_phone: data.school_phone || '',
          school_email: data.school_email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching studies data:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('athlete_studies')
        .select('id')
        .eq('athlete_id', athleteId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const saveData = {
        athlete_id: athleteId,
        ...formData,
      };

      if (existing) {
        const { error } = await supabase
          .from('athlete_studies')
          .update(saveData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('athlete_studies')
          .insert(saveData);
        if (error) throw error;
      }

      toast({
        title: "Información académica actualizada",
        description: "La información académica ha sido guardada correctamente.",
      });

      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving studies data:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información académica. Inténtalo de nuevo.",
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
          <Label htmlFor="education_level">Nivel Educativo</Label>
          <Select value={formData.education_level} onValueChange={(value) => handleInputChange('education_level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primaria">Primaria</SelectItem>
              <SelectItem value="secundaria">Secundaria</SelectItem>
              <SelectItem value="bachillerato">Bachillerato</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="universitario">Universitario</SelectItem>
              <SelectItem value="posgrado">Posgrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="current_grade">Grado Actual</Label>
          <Select value={formData.current_grade} onValueChange={(value) => handleInputChange('current_grade', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione grado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1°</SelectItem>
              <SelectItem value="2">2°</SelectItem>
              <SelectItem value="3">3°</SelectItem>
              <SelectItem value="4">4°</SelectItem>
              <SelectItem value="5">5°</SelectItem>
              <SelectItem value="6">6°</SelectItem>
              <SelectItem value="7">7°</SelectItem>
              <SelectItem value="8">8°</SelectItem>
              <SelectItem value="9">9°</SelectItem>
              <SelectItem value="10">10°</SelectItem>
              <SelectItem value="11">11°</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="school_name">Nombre del Colegio/Universidad</Label>
        <Input
          id="school_name"
          value={formData.school_name}
          onChange={(e) => handleInputChange('school_name', e.target.value)}
          placeholder="Nombre de la institución educativa"
        />
      </div>

      <div>
        <Label htmlFor="school_address">Dirección</Label>
        <Input
          id="school_address"
          value={formData.school_address}
          onChange={(e) => handleInputChange('school_address', e.target.value)}
          placeholder="Dirección de la institución"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="school_phone">Teléfono</Label>
          <Input
            id="school_phone"
            value={formData.school_phone}
            onChange={(e) => handleInputChange('school_phone', e.target.value)}
            placeholder="Teléfono de contacto"
          />
        </div>
        <div>
          <Label htmlFor="school_email">Email</Label>
          <Input
            id="school_email"
            type="email"
            value={formData.school_email}
            onChange={(e) => handleInputChange('school_email', e.target.value)}
            placeholder="Email de contacto"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar Información Académica
      </Button>
    </div>
  );
};
