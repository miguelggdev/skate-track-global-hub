import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemSetting } from '@/pages/ClubConfig';
import { Dumbbell } from 'lucide-react';
import SettingRow from './SettingRow';

interface TrainingSettingsProps {
  settings: SystemSetting[];
  onUpdate: () => void;
}

const TrainingSettings = ({ settings, onUpdate }: TrainingSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Configuración de Entrenamientos
        </CardTitle>
        <CardDescription>
          Configura parámetros por defecto para sesiones de entrenamiento y gestión de atletas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay configuraciones de entrenamiento disponibles
          </p>
        ) : (
          settings.map((setting) => (
            <SettingRow 
              key={setting.id} 
              setting={setting} 
              onUpdate={onUpdate} 
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingSettings;