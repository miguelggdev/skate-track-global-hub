import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';

export const BodyTab = () => {
  const { athlete } = useCurrentAthlete();
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
    if (athlete?.id) {
      fetchBodyData();
    }
  }, [athlete?.id]);

  const fetchBodyData = async () => {
    if (!athlete?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_body_info')
        .select('*')
        .eq('athlete_id', athlete.id)
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
        size: formData.size,
        blood_type: formData.blood_type,
        allergies: formData.allergies,
        surgeries: formData.surgeries,
        injuries: formData.injuries,
        limitations: formData.limitations,
      };

      const { error } = await supabase
        .from('athlete_body_info')
        .upsert(saveData);

      if (error) throw error;

      toast({
        title: "Información médica actualizada",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Mi Cuerpo
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
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Información Médica'}
        </Button>
      </CardContent>
    </Card>
  );
};