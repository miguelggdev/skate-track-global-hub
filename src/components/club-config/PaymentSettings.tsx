import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemSetting } from '@/pages/ClubConfig';
import { CreditCard } from 'lucide-react';
import SettingRow from './SettingRow';

interface PaymentSettingsProps {
  settings: SystemSetting[];
  onUpdate: () => void;
}

const PaymentSettings = ({ settings, onUpdate }: PaymentSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configuración de Pagos
        </CardTitle>
        <CardDescription>
          Gestiona las políticas de pago, tarifas y configuraciones financieras
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay configuraciones de pago disponibles
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

export default PaymentSettings;