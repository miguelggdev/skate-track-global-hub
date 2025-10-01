import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';

export const SkatesTab = () => {
  const { athlete } = useCurrentAthlete();
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
    if (athlete?.id) {
      fetchEquipmentData();
    }
  }, [athlete?.id]);

  const fetchEquipmentData = async () => {
    if (!athlete?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_equipment')
        .select('*')
        .eq('athlete_id', athlete.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          boot_brand: data.boot_brand || '',
          boot_size: data.boot_size?.toString() || '',
          frame_brand: data.frame_brand || '',
          frame_size: data.frame_size || '',
          track_wheels_brand: data.track_wheels_brand || '',
          wheel_diameter: data.wheel_diameter?.toString() || '',
          helmet_brand: data.helmet_brand || '',
        });
      }
    } catch (error) {
      console.error('Error fetching equipment data:', error);
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
      // Check if record exists
      const { data: existing } = await supabase
        .from('athlete_equipment')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const saveData = {
        athlete_id: athlete.id,
        boot_brand: formData.boot_brand,
        boot_size: formData.boot_size ? parseInt(formData.boot_size) : null,
        frame_brand: formData.frame_brand,
        frame_size: formData.frame_size,
        track_wheels_brand: formData.track_wheels_brand,
        wheel_diameter: formData.wheel_diameter ? parseInt(formData.wheel_diameter) : null,
        helmet_brand: formData.helmet_brand,
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('athlete_equipment')
          .update(saveData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('athlete_equipment')
          .insert(saveData);
        if (error) throw error;
      }

      toast({
        title: "Información de equipo actualizada",
        description: "Tu información de equipo ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error saving equipment data:', error);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Mis Patines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Información de Bota</h4>
            <div>
              <Label htmlFor="bootBrand">Marca de Bota</Label>
              <Input 
                id="bootBrand" 
                placeholder="Ej: Bont, Luigino"
                value={formData.boot_brand}
                onChange={(e) => handleInputChange('boot_brand', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bootSize">Número de Bota</Label>
              <Input 
                id="bootSize" 
                type="number" 
                placeholder="Ej: 42"
                value={formData.boot_size}
                onChange={(e) => handleInputChange('boot_size', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Chasis y Ruedas</h4>
            <div>
              <Label htmlFor="frameBrand">Marca de Chasis</Label>
              <Input 
                id="frameBrand" 
                placeholder="Ej: Roll-Line, Atom"
                value={formData.frame_brand}
                onChange={(e) => handleInputChange('frame_brand', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="frameSize">Medidas de Chasis</Label>
              <Input 
                id="frameSize" 
                placeholder="Ej: 13 pulgadas"
                value={formData.frame_size}
                onChange={(e) => handleInputChange('frame_size', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Ruedas de Pista</h4>
            <div>
              <Label htmlFor="trackWheels">Marca de Ruedas</Label>
              <Input 
                id="trackWheels" 
                placeholder="Ej: Matter, Hyper"
                value={formData.track_wheels_brand}
                onChange={(e) => handleInputChange('track_wheels_brand', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wheelDiameter">Diámetro</Label>
              <Select value={formData.wheel_diameter} onValueChange={(value) => handleInputChange('wheel_diameter', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80mm</SelectItem>
                  <SelectItem value="84">84mm</SelectItem>
                  <SelectItem value="90">90mm</SelectItem>
                  <SelectItem value="100">100mm</SelectItem>
                  <SelectItem value="110">110mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Equipo de Protección</h4>
            <div>
              <Label htmlFor="helmet">Marca de Casco</Label>
              <Input 
                id="helmet" 
                placeholder="Ej: Pro-tec, Bauer"
                value={formData.helmet_brand}
                onChange={(e) => handleInputChange('helmet_brand', e.target.value)}
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Información de Equipo'}
        </Button>
      </CardContent>
    </Card>
  );
};