import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SystemSetting } from '@/pages/ClubConfig';
import { Dumbbell, Save, RotateCcw } from 'lucide-react';
import { useBulkSettingsSave } from '@/hooks/useBulkSettingsSave';
import SettingRow from './SettingRow';

interface TrainingSettingsProps {
  settings: SystemSetting[];
  onUpdate: () => void;
}

const TrainingSettings = ({ settings, onUpdate }: TrainingSettingsProps) => {
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});
  const { saveBulkSettings, loading } = useBulkSettingsSave();

  const handleLocalChange = (settingId: string, value: string) => {
    setLocalChanges(prev => ({
      ...prev,
      [settingId]: value
    }));
  };

  const handleSaveAll = async () => {
    const updatedSettings = settings.map(setting => ({
      ...setting,
      setting_value: localChanges[setting.id] || setting.setting_value
    }));

    const result = await saveBulkSettings(updatedSettings);
    if (result.success) {
      setLocalChanges({});
      onUpdate();
    }
  };

  const handleReset = () => {
    setLocalChanges({});
  };

  const hasChanges = Object.keys(localChanges).length > 0;

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
          <>
            <div className="space-y-4">
              {settings.map((setting) => (
                <SettingRow 
                  key={setting.id} 
                  setting={setting} 
                  onUpdate={onUpdate}
                  onLocalChange={handleLocalChange}
                  bulkMode={true}
                  hasChanges={!!localChanges[setting.id]}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button 
                onClick={handleSaveAll}
                disabled={!hasChanges || loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Guardando...' : 'Guardar configuración'}
              </Button>
              
              {hasChanges && (
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetear
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingSettings;