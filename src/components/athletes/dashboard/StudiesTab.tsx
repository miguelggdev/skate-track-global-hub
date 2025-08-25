import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';

export const StudiesTab = () => {
  const { athlete } = useCurrentAthlete();
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
    if (athlete?.id) {
      fetchStudiesData();
    }
  }, [athlete?.id]);

  const fetchStudiesData = async () => {
    if (!athlete?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_studies')
        .select('*')
        .eq('athlete_id', athlete.id)
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
      const { error } = await supabase
        .from('athlete_studies')
        .upsert({
          athlete_id: athlete.id,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Información académica actualizada",
        description: "Tu información académica ha sido guardada correctamente.",
      });
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Mis Estudios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="educationLevel">Nivel Educativo</Label>
            <Select value={formData.education_level} onValueChange={(value) => handleInputChange('education_level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primaria">Primaria</SelectItem>
                <SelectItem value="secundaria">Secundaria</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="universitario">Universitario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="currentGrade">Curso Actual</Label>
            <Select value={formData.current_grade} onValueChange={(value) => handleInputChange('current_grade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(11)].map((_, i) => (
                  <SelectItem key={i+1} value={`${i+1}`}>{i+1}°</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="school">Institución educativa Actual</Label>
            <Input 
              id="school" 
              placeholder="Nombre de la institución educativa"
              value={formData.school_name}
              onChange={(e) => handleInputChange('school_name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="schoolAddress">Dirección de la Institución educativa</Label>
            <Input 
              id="schoolAddress" 
              placeholder="Dirección"
              value={formData.school_address}
              onChange={(e) => handleInputChange('school_address', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="schoolPhone">Teléfono de la Institución educativa</Label>
            <Input 
              id="schoolPhone" 
              placeholder="Teléfono"
              value={formData.school_phone}
              onChange={(e) => handleInputChange('school_phone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="schoolEmail">Correo de la Institución educativa</Label>
            <Input 
              id="schoolEmail" 
              type="email" 
              placeholder="Email"
              value={formData.school_email}
              onChange={(e) => handleInputChange('school_email', e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Información Académica'}
        </Button>
      </CardContent>
    </Card>
  );
};