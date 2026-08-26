import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EquipmentInfoFormProps {
  athleteId: string;
  onSave?: () => void;
}

export const EquipmentInfoForm: React.FC<EquipmentInfoFormProps> = ({ athleteId, onSave }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    boot_brand: '',
    boot_size: '',
    frame_brand: '',
    frame_size: '',
    track_wheels_brand: '',
    wheel_diameter: '',
    helmet_brand: '',
  });

  useEffect(() => {
    if (athleteId) {
      fetchEquipmentData();
    }
  }, [athleteId]);

  const fetchEquipmentData = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_equipment')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          boot_brand: data.boot_brand ?? '',
          boot_size: data.boot_size?.toString() ?? '',
          frame_brand: data.frame_brand ?? '',
          frame_size: data.frame_size ?? '',
          track_wheels_brand: data.track_wheels_brand ?? '',
          wheel_diameter: data.wheel_diameter?.toString() ?? '',
          helmet_brand: data.helmet_brand ?? '',
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el equipamiento",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('athlete_equipment')
        .select('id')
        .eq('athlete_id', athleteId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const saveData = {
        athlete_id: athleteId,
        boot_brand: formData.boot_brand,
        boot_size: formData.boot_size ? parseInt(formData.boot_size) : null,
        frame_brand: formData.frame_brand,
        frame_size: formData.frame_size,
        track_wheels_brand: formData.track_wheels_brand,
        wheel_diameter: formData.wheel_diameter ? parseInt(formData.wheel_diameter) : null,
        helmet_brand: formData.helmet_brand,
      };

      if (existing) {
        const { error } = await supabase
          .from('athlete_equipment')
          .update(saveData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('athlete_equipment')
          .insert(saveData);
        if (error) throw error;
      }

      toast({
        title: "Información de equipo actualizada",
        description: "La información de equipo ha sido guardada correctamente.",
      });

      if (onSave) onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la información de equipo. Inténtalo de nuevo.",
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
          <Label htmlFor="boot_brand">Marca de Botas</Label>
          <Input
            id="boot_brand"
            value={formData.boot_brand}
            onChange={(e) => handleInputChange('boot_brand', e.target.value)}
            placeholder="Ej: Bont, Powerslide"
          />
        </div>
        <div>
          <Label htmlFor="boot_size">Talla de Botas</Label>
          <Select value={formData.boot_size} onValueChange={(value) => handleInputChange('boot_size', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione talla" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => 30 + i).map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frame_brand">Marca de Chasis</Label>
          <Input
            id="frame_brand"
            value={formData.frame_brand}
            onChange={(e) => handleInputChange('frame_brand', e.target.value)}
            placeholder="Ej: Powerslide, Roll Line"
          />
        </div>
        <div>
          <Label htmlFor="frame_size">Tamaño de Chasis</Label>
          <Select value={formData.frame_size} onValueChange={(value) => handleInputChange('frame_size', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione tamaño" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12.2">12.2"</SelectItem>
              <SelectItem value="12.4">12.4"</SelectItem>
              <SelectItem value="12.6">12.6"</SelectItem>
              <SelectItem value="12.8">12.8"</SelectItem>
              <SelectItem value="13.0">13.0"</SelectItem>
              <SelectItem value="13.2">13.2"</SelectItem>
              <SelectItem value="13.4">13.4"</SelectItem>
              <SelectItem value="13.6">13.6"</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="track_wheels_brand">Marca de Ruedas</Label>
          <Input
            id="track_wheels_brand"
            value={formData.track_wheels_brand}
            onChange={(e) => handleInputChange('track_wheels_brand', e.target.value)}
            placeholder="Ej: Matter, Atom"
          />
        </div>
        <div>
          <Label htmlFor="wheel_diameter">Diámetro de Ruedas (mm)</Label>
          <Select value={formData.wheel_diameter} onValueChange={(value) => handleInputChange('wheel_diameter', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione diámetro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="84">84mm</SelectItem>
              <SelectItem value="90">90mm</SelectItem>
              <SelectItem value="100">100mm</SelectItem>
              <SelectItem value="110">110mm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="helmet_brand">Marca de Casco</Label>
        <Input
          id="helmet_brand"
          value={formData.helmet_brand}
          onChange={(e) => handleInputChange('helmet_brand', e.target.value)}
          placeholder="Ej: Bell, Bont"
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar Información de Equipo
      </Button>
    </div>
  );
};
