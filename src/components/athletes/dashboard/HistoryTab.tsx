import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { HistoryRecordField } from './history/HistoryRecordField';

export const HistoryTab = () => {
  const { athlete } = useCurrentAthlete();
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
    if (athlete?.id) {
      fetchHistoryData();
    }
  }, [athlete?.id]);

  const fetchHistoryData = async () => {
    if (!athlete?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_history')
        .select('*')
        .eq('athlete_id', athlete.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          previous_club: data.previous_club || '',
          years_experience: data.years_experience || 0,
          start_date: data.start_date || '',
          league_date: data.league_date || '',
          federation_date: data.federation_date || '',
          is_league: data.is_league || false,
          is_federated: data.is_federated || false,
        });
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
        .from('athlete_history')
        .upsert({
          athlete_id: athlete.id,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Historial actualizado",
        description: "Tu información de historial ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error saving history data:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el historial. Inténtalo de nuevo.",
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
          <Trophy className="h-5 w-5" />
          Historial de Patinaje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <HistoryRecordField
            label="Escuela/Club Anterior"
            placeholder="Si has pertenecido a otro club"
            value={formData.previous_club}
            onChange={(value) => handleInputChange('previous_club', value)}
            type="text"
          />
          
          <div>
            <Label htmlFor="yearsExperience">Años de Práctica</Label>
            <Input 
              id="yearsExperience" 
              type="number" 
              placeholder="Años"
              value={formData.years_experience}
              onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <HistoryRecordField
            label="Fecha de Inicio en el Patinaje"
            placeholder="Fecha de inicio"
            value={formData.start_date}
            onChange={(value) => handleInputChange('start_date', value)}
            type="date"
          />
          
          <HistoryRecordField
            label="Fecha de Liga"
            placeholder="Fecha de liga"
            value={formData.league_date}
            onChange={(value) => handleInputChange('league_date', value)}
            type="date"
          />
          
          <HistoryRecordField
            label="Fecha de Federación"
            placeholder="Fecha de federación"
            value={formData.federation_date}
            onChange={(value) => handleInputChange('federation_date', value)}
            type="date"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isLeague" 
              checked={formData.is_league}
              onCheckedChange={(checked) => handleInputChange('is_league', checked)}
            />
            <Label htmlFor="isLeague">¿Ligado a Liga?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isFederated" 
              checked={formData.is_federated}
              onCheckedChange={(checked) => handleInputChange('is_federated', checked)}
            />
            <Label htmlFor="isFederated">¿Federado?</Label>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Actualizar Historial'}
        </Button>
      </CardContent>
    </Card>
  );
};