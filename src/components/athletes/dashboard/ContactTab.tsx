import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
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

interface ContactTabProps {
  athlete: AthleteData;
}

export const ContactTab = ({ athlete }: ContactTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    emergency_contact_name: athlete.emergency_contact_name || '',
    emergency_contact_phone: athlete.emergency_contact_phone || '',
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
        title: "Contacto actualizado",
        description: "Tu información de contacto ha sido guardada correctamente.",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el contacto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      emergency_contact_name: athlete.emergency_contact_name || '',
      emergency_contact_phone: athlete.emergency_contact_phone || '',
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mi Contacto
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
            <Label htmlFor="email">Email Principal</Label>
            <Input id="email" type="email" value={athlete.email} disabled />
          </div>
          <div>
            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              value={athlete.date_of_birth || ''}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="emergency_contact_name">Contacto de Emergencia</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
              disabled={!isEditing}
              placeholder="Nombre del contacto de emergencia"
            />
          </div>
          <div>
            <Label htmlFor="emergency_contact_phone">Teléfono de Emergencia</Label>
            <Input
              id="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              disabled={!isEditing}
              placeholder="Número de teléfono"
            />
          </div>
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Información del Deportista</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Categoría:</span> {athlete.category}
            </div>
            <div>
              <span className="font-medium">Nivel:</span> {athlete.level}
            </div>
            <div>
              <span className="font-medium">Estado:</span> {athlete.status}
            </div>
            {athlete.athlete_number && (
              <div>
                <span className="font-medium">Número:</span> {athlete.athlete_number}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};