import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Calendar } from 'lucide-react';

export const MaintenanceTab = () => {
  const maintenanceHistory = [
    { date: '2024-01-15', type: 'Cambio de ruedas', description: 'Cambio completo de ruedas de pista' },
    { date: '2024-01-10', type: 'Ajuste de chasis', description: 'Alineación y ajuste de tornillos' },
    { date: '2024-01-05', type: 'Limpieza general', description: 'Limpieza y lubricación' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Mantenimiento de Patines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 mb-4">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Nuevo Mantenimiento
          </Button>
        </div>
        
        <div className="space-y-4">
          {maintenanceHistory.map((maintenance) => (
            <div key={`${maintenance.type}-${maintenance.date}`} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{maintenance.type}</h4>
                  <p className="text-sm text-gray-600">{maintenance.description}</p>
                </div>
                <span className="text-sm text-gray-500">{maintenance.date}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};