import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Download } from 'lucide-react';

export const PaymentsTab = () => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const paymentStatus = {
    'Enero': true, 'Febrero': true, 'Marzo': false, 'Abril': false,
    'Mayo': false, 'Junio': false, 'Julio': false, 'Agosto': false,
    'Septiembre': false, 'Octubre': false, 'Noviembre': false, 'Diciembre': false
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Mis Pagos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Valor Mensualidad</Label>
            <div className="text-2xl font-bold text-green-600">$150.000 COP</div>
          </div>
          <div>
            <Label htmlFor="year">Año</Label>
            <Select defaultValue="2024">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {months.map((month) => (
            <div key={month} className={`border rounded-lg p-3 text-center ${
              paymentStatus[month] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="font-medium">{month}</div>
              <div className={`text-sm ${
                paymentStatus[month] ? 'text-green-600' : 'text-red-600'
              }`}>
                {paymentStatus[month] ? 'Pagado' : 'Pendiente'}
              </div>
              {paymentStatus[month] && (
                <Button size="sm" variant="outline" className="mt-2">
                  <Download className="h-3 w-3 mr-1" />
                  Recibo
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};