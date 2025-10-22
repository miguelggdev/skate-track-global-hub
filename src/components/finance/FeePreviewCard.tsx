import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFeeSettings } from '@/hooks/useFeeSettings';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { Calculator, TrendingUp, CalendarClock, DollarSign } from 'lucide-react';

export const FeePreviewCard = () => {
  const { data: feeSettings, isLoading } = useFeeSettings();
  const { currency } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Cargando configuración de tarifas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!feeSettings) {
    return null;
  }

  const incrementedFee = feeSettings.enable_extraordinary_increment
    ? feeSettings.monthly_fee + (feeSettings.monthly_fee * feeSettings.increment_percentage / 100)
    : feeSettings.monthly_fee;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Vista Previa de Tarifas
        </CardTitle>
        <CardDescription>
          Configuración actual de cuotas y pagos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Fee */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Cuota Mensual Base</p>
              <p className="text-xs text-muted-foreground">Tarifa estándar por deportista</p>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(feeSettings.monthly_fee, currency)}</p>
        </div>

        {/* Registration Fee */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Cuota de Inscripción</p>
              <p className="text-xs text-muted-foreground">Pago único al inscribirse</p>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(feeSettings.registration_fee, currency)}</p>
        </div>

        {/* Extraordinary Increment */}
        {feeSettings.enable_extraordinary_increment ? (
          <Alert className="border-orange-200 bg-orange-50">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Incremento Extraordinario Activo</p>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    +{feeSettings.increment_percentage}%
                  </Badge>
                </div>
                <p className="text-sm">
                  A partir del día <strong>{feeSettings.increment_start_day}</strong> de cada mes, 
                  la cuota mensual será de <strong>{formatCurrency(incrementedFee, currency)}</strong>
                </p>
                <div className="pt-2 mt-2 border-t border-orange-200">
                  <p className="text-xs text-orange-700">
                    Cuota base: {formatCurrency(feeSettings.monthly_fee, currency)} + 
                    Incremento: {formatCurrency(feeSettings.monthly_fee * feeSettings.increment_percentage / 100, currency)} = 
                    Total: {formatCurrency(incrementedFee, currency)}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription className="text-sm">
              El incremento extraordinario está desactivado. Todos los pagos utilizan la tarifa base.
            </AlertDescription>
          </Alert>
        )}

        {/* Visual Calendar Helper */}
        {feeSettings.enable_extraordinary_increment && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Calendario de Aplicación</p>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const hasIncrement = day >= feeSettings.increment_start_day;
                return (
                  <div
                    key={day}
                    className={`
                      p-2 text-center text-xs rounded border
                      ${hasIncrement 
                        ? 'bg-orange-100 border-orange-300 text-orange-900 font-medium' 
                        : 'bg-green-50 border-green-200 text-green-900'}
                    `}
                    title={hasIncrement 
                      ? `Día ${day}: Con incremento (${formatCurrency(incrementedFee, currency)})` 
                      : `Día ${day}: Tarifa base (${formatCurrency(feeSettings.monthly_fee, currency)})`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                <span>Tarifa base</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
                <span>Con incremento</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
