import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SystemSetting } from '@/pages/ClubConfig';
import { CreditCard, Save, RotateCcw, Percent, Calendar } from 'lucide-react';
import { useBulkSettingsSave } from '@/hooks/useBulkSettingsSave';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SettingRow from './SettingRow';

interface PaymentSettingsProps {
  settings: SystemSetting[];
  onUpdate: () => void;
}

const PaymentSettings = ({ settings, onUpdate }: PaymentSettingsProps) => {
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});
  const { saveBulkSettings, loading } = useBulkSettingsSave();
  const { currency } = useCurrency();

  // Extract fee-specific settings
  const getFeeSettings = () => {
    const feeKeys = ['monthly_fee', 'registration_fee', 'enable_extraordinary_increment', 'increment_start_day', 'increment_percentage'];
    return settings.filter(s => feeKeys.includes(s.setting_key));
  };

  const getOtherSettings = () => {
    const feeKeys = ['monthly_fee', 'registration_fee', 'enable_extraordinary_increment', 'increment_start_day', 'increment_percentage'];
    return settings.filter(s => !feeKeys.includes(s.setting_key));
  };

  const getSettingValue = (key: string): string => {
    if (localChanges[key] !== undefined) return localChanges[key];
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value ?? '';
  };

  const incrementEnabled = getSettingValue('enable_extraordinary_increment') === 'true';

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
          <CreditCard className="h-5 w-5" />
          Configuración de Pagos
        </CardTitle>
        <CardDescription>
          Gestiona las políticas de pago, tarifas y configuraciones financieras
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay configuraciones de pago disponibles
          </p>
        ) : (
          <>
            {/* Fee Management Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Tarifas y Cuotas</h3>
                <p className="text-sm text-muted-foreground">Configure las tarifas base y cuotas de inscripción</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Fee */}
                <div className="space-y-2">
                  <Label htmlFor="monthly_fee">Cuota Mensual (COP)</Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    value={getSettingValue('monthly_fee')}
                    onChange={(e) => {
                      const setting = settings.find(s => s.setting_key === 'monthly_fee');
                      if (setting) handleLocalChange(setting.id, e.target.value);
                    }}
                    placeholder="230000"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tarifa mensual base por deportista
                  </p>
                </div>

                {/* Registration Fee */}
                <div className="space-y-2">
                  <Label htmlFor="registration_fee">Cuota de Inscripción (COP)</Label>
                  <Input
                    id="registration_fee"
                    type="number"
                    value={getSettingValue('registration_fee')}
                    onChange={(e) => {
                      const setting = settings.find(s => s.setting_key === 'registration_fee');
                      if (setting) handleLocalChange(setting.id, e.target.value);
                    }}
                    placeholder="150000"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pago único al inscribirse
                  </p>
                </div>
              </div>
            </div>

            {/* Extraordinary Increment Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Incremento Extraordinario
                </h3>
                <p className="text-sm text-muted-foreground">Configure el incremento automático por mora de pago</p>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label htmlFor="enable_increment" className="text-base font-medium cursor-pointer">
                    Activar incremento extraordinario
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Aplica un recargo a pagos realizados después del día configurado
                  </p>
                </div>
                <Switch
                  id="enable_increment"
                  checked={incrementEnabled}
                  onCheckedChange={(checked) => {
                    const setting = settings.find(s => s.setting_key === 'enable_extraordinary_increment');
                    if (setting) handleLocalChange(setting.id, checked.toString());
                  }}
                />
              </div>

              {/* Increment Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="increment_start_day" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Día de inicio del incremento
                  </Label>
                  <Input
                    id="increment_start_day"
                    type="number"
                    min="1"
                    max="31"
                    value={getSettingValue('increment_start_day')}
                    onChange={(e) => {
                      const setting = settings.find(s => s.setting_key === 'increment_start_day');
                      if (setting) handleLocalChange(setting.id, e.target.value);
                    }}
                    disabled={!incrementEnabled}
                    placeholder="15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Día del mes (1-31) cuando se aplica el recargo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="increment_percentage" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Porcentaje de incremento
                  </Label>
                  <div className="relative">
                    <Input
                      id="increment_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={getSettingValue('increment_percentage')}
                      onChange={(e) => {
                        const setting = settings.find(s => s.setting_key === 'increment_percentage');
                        if (setting) handleLocalChange(setting.id, e.target.value);
                      }}
                      disabled={!incrementEnabled}
                      placeholder="10"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Porcentaje a incrementar (0-100%)
                  </p>
                </div>
              </div>

              {/* Preview Alert */}
              {incrementEnabled && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-sm text-orange-900">
                    <strong>Vista previa:</strong> A partir del día{' '}
                    <strong>{getSettingValue('increment_start_day')}</strong> de cada mes, 
                    la cuota mensual será de{' '}
                    <strong>
                      {formatCurrency(
                        Number(getSettingValue('monthly_fee')) * (1 + Number(getSettingValue('increment_percentage')) / 100),
                        currency
                      )}
                    </strong>{' '}
                    (base: {formatCurrency(Number(getSettingValue('monthly_fee')), currency)} + 
                    incremento {getSettingValue('increment_percentage')}%)
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Other Payment Settings */}
            {getOtherSettings().length > 0 && (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Otras Configuraciones</h3>
                </div>
                <div className="space-y-4">
                  {getOtherSettings().map((setting) => (
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
              </div>
            )}
            
            {/* Save Actions */}
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

export default PaymentSettings;