import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface HistoryInfoFormProps {
  athleteId: string;
  onSave?: () => void;
}

export const HistoryInfoForm: React.FC<HistoryInfoFormProps> = ({ athleteId, onSave }) => {
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
    if (athleteId) {
      fetchHistoryData();
    }
  }, [athleteId]);

  const fetchHistoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_history')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
        .limit(1)
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
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const saveData = {
        athlete_id: athleteId,
        previous_club: formData.previous_club,
        years_experience: formData.years_experience,
        start_date: formData.start_date || null,
        league_date: formData.league_date || null,
        federation_date: formData.federation_date || null,
        is_league: formData.is_league,
        is_federated: formData.is_federated,
      };

      const { error } = await supabase
        .from('athlete_history')
        .insert(saveData);

      if (error) throw error;

      toast({
        title: "Registro histórico agregado",
        description: "El registro histórico ha sido guardado correctamente.",
      });

      // Reset form
      setFormData({
        previous_club: '',
        years_experience: 0,
        start_date: '',
        league_date: '',
        federation_date: '',
        is_league: false,
        is_federated: false,
      });

      if (onSave) onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el registro histórico. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="previous_club">Club Anterior</Label>
        <Input
          id="previous_club"
          value={formData.previous_club}
          onChange={(e) => handleInputChange('previous_club', e.target.value)}
          placeholder="Nombre del club anterior"
        />
      </div>

      <div>
        <Label htmlFor="years_experience">Años de Experiencia</Label>
        <Input
          id="years_experience"
          type="number"
          value={formData.years_experience}
          onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="start_date">Fecha de Inicio</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="league_date">Fecha de Liga</Label>
          <Input
            id="league_date"
            type="date"
            value={formData.league_date}
            onChange={(e) => handleInputChange('league_date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="federation_date">Fecha de Federación</Label>
          <Input
            id="federation_date"
            type="date"
            value={formData.federation_date}
            onChange={(e) => handleInputChange('federation_date', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_league"
            checked={formData.is_league}
            onCheckedChange={(checked) => handleInputChange('is_league', checked as boolean)}
          />
          <Label htmlFor="is_league" className="cursor-pointer">
            Pertenece a Liga
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_federated"
            checked={formData.is_federated}
            onCheckedChange={(checked) => handleInputChange('is_federated', checked as boolean)}
          />
          <Label htmlFor="is_federated" className="cursor-pointer">
            Está Federado
          </Label>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Agregar Registro Histórico
      </Button>
    </div>
  );
};
