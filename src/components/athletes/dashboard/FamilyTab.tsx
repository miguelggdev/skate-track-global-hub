import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';

export const FamilyTab = () => {
  const { athlete } = useCurrentAthlete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_email: '',
  });

  useEffect(() => {
    if (athlete?.id) {
      fetchFamilyData();
    }
  }, [athlete?.id]);

  const fetchFamilyData = async () => {
    if (!athlete?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_family')
        .select('*')
        .eq('athlete_id', athlete.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          parent_name: data.parent_name ?? '',
          parent_phone: data.parent_phone ?? '',
          parent_email: data.parent_email ?? '',
          guardian_name: data.guardian_name ?? '',
          guardian_relationship: data.guardian_relationship ?? '',
          guardian_phone: data.guardian_phone ?? '',
          guardian_email: data.guardian_email ?? '',
        });
      }
    } catch (error) {
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
        .from('athlete_family')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const saveData = {
        athlete_id: athlete.id,
        ...formData,
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('athlete_family')
          .update(saveData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('athlete_family')
          .insert(saveData);
        if (error) throw error;
      }

      toast({
        title: "Información familiar actualizada",
        description: "Tu información familiar ha sido guardada correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la información familiar. Inténtalo de nuevo.",
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
          <Users className="h-5 w-5" />
          Mi Familia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Información de Padres</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">Nombres y Apellidos</Label>
                <Input 
                  id="parentName" 
                  placeholder="Nombre completo del padre/madre"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="parentPhone">Teléfono</Label>
                <Input 
                  id="parentPhone" 
                  placeholder="Teléfono"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="parentEmail">Email</Label>
                <Input 
                  id="parentEmail" 
                  type="email" 
                  placeholder="Email"
                  value={formData.parent_email}
                  onChange={(e) => handleInputChange('parent_email', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Acudiente Autorizado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianName">Nombre del Acudiente</Label>
                <Input 
                  id="guardianName" 
                  placeholder="Si es diferente a los padres"
                  value={formData.guardian_name}
                  onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="relationship">Parentesco</Label>
                <Select value={formData.guardian_relationship} onValueChange={(value) => handleInputChange('guardian_relationship', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tio">Tío/Tía</SelectItem>
                    <SelectItem value="abuelo">Abuelo/Abuela</SelectItem>
                    <SelectItem value="hermano">Hermano/Hermana</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="guardianPhone">Teléfono</Label>
                <Input 
                  id="guardianPhone" 
                  placeholder="Teléfono"
                  value={formData.guardian_phone}
                  onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guardianEmail">Email</Label>
                <Input 
                  id="guardianEmail" 
                  type="email" 
                  placeholder="Email"
                  value={formData.guardian_email}
                  onChange={(e) => handleInputChange('guardian_email', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Información Familiar'}
        </Button>
      </CardContent>
    </Card>
  );
};