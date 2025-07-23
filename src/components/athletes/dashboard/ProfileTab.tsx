import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null;
  category: string;
  level: string;
  status: string;
  performance_score: number;
  athlete_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  achievements: string | null;
}

interface ProfileTabProps {
  athlete: AthleteData;
}

export const ProfileTab = ({ athlete }: ProfileTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    first_name: athlete.first_name || '',
    last_name: athlete.last_name || '',
    email: athlete.email || '',
    date_of_birth: athlete.date_of_birth || '',
    athlete_number: athlete.athlete_number || '',
    emergency_contact_name: athlete.emergency_contact_name || '',
    emergency_contact_phone: athlete.emergency_contact_phone || '',
    medical_notes: athlete.medical_notes || '',
    achievements: athlete.achievements || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('athletes')
        .update(formData)
        .eq('id', athlete.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada correctamente.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: athlete.first_name || '',
      last_name: athlete.last_name || '',
      email: athlete.email || '',
      date_of_birth: athlete.date_of_birth || '',
      athlete_number: athlete.athlete_number || '',
      emergency_contact_name: athlete.emergency_contact_name || '',
      emergency_contact_phone: athlete.emergency_contact_phone || '',
      medical_notes: athlete.medical_notes || '',
      achievements: athlete.achievements || '',
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil General
          </CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">Nombre</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="last_name">Apellidos</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="athlete_number">Número de Deportista</Label>
            <Input
              id="athlete_number"
              value={formData.athlete_number}
              onChange={(e) => handleInputChange('athlete_number', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>Estado</Label>
            <Badge variant={athlete.status === 'active' ? 'default' : 'secondary'}>
              {athlete.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Categoría</Label>
            <Badge variant="outline">{athlete.category}</Badge>
          </div>
          <div>
            <Label>Nivel</Label>
            <Badge variant="outline">{athlete.level}</Badge>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergency_contact_name">Contacto de Emergencia</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="emergency_contact_phone">Teléfono de Emergencia</Label>
            <Input
              id="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="medical_notes">Notas Médicas</Label>
          <Textarea
            id="medical_notes"
            value={formData.medical_notes}
            onChange={(e) => handleInputChange('medical_notes', e.target.value)}
            disabled={!isEditing}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="achievements">Logros</Label>
          <Textarea
            id="achievements"
            value={formData.achievements}
            onChange={(e) => handleInputChange('achievements', e.target.value)}
            disabled={!isEditing}
            rows={3}
          />
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Puntuación de Rendimiento</h4>
          <div className="text-2xl font-bold text-primary">
            {athlete.performance_score}/100
          </div>
        </div>
      </CardContent>
    </Card>
  );
};