import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemSetting } from '@/pages/ClubConfig';
import { Bell } from 'lucide-react';
import SettingRow from './SettingRow';

interface NotificationSettingsProps {
  settings: SystemSetting[];
  onUpdate: () => void;
}

const NotificationSettings = ({ settings, onUpdate }: NotificationSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configuración de Notificaciones
        </CardTitle>
        <CardDescription>
          Configura cómo y cuándo se envían las notificaciones a usuarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay configuraciones de notificaciones disponibles
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

export default NotificationSettings;