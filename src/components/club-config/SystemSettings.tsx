import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemSetting } from '@/pages/ClubConfig';
import { Settings } from 'lucide-react';
import SettingRow from './SettingRow';

interface SystemSettingsProps {
  settings: SystemSetting[];
  onUpdate: () => void;
}

const SystemSettings = ({ settings, onUpdate }: SystemSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración del Sistema
        </CardTitle>
        <CardDescription>
          Ajustes generales del sistema y configuraciones avanzadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay configuraciones del sistema disponibles
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

export default SystemSettings;