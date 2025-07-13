import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Star, Clock } from 'lucide-react';

const HighlightsSection: React.FC = () => {
  const highlights = [
    {
      type: 'athlete',
      title: 'Deportista del Mes',
      name: 'María González',
      achievement: '3 Medallas de Oro',
      avatar: null,
      icon: Trophy,
      color: 'hsl(var(--dashboard-accent))'
    },
    {
      type: 'recent',
      title: 'Logros Recientes',
      items: [
        { text: 'Regional Championship - 1er Lugar', date: '2 días' },
        { text: 'Nuevo récord personal - Ana López', date: '5 días' },
        { text: 'Certificación nivel avanzado - 8 atletas', date: '1 semana' }
      ]
    }
  ];

  const equipmentStatus = [
    { item: 'Patines', total: 120, available: 95, status: 'good' },
    { item: 'Protecciones', total: 150, available: 142, status: 'excellent' },
    { item: 'Cascos', total: 80, available: 71, status: 'warning' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'hsl(var(--dashboard-success))';
      case 'good': return 'hsl(var(--dashboard-primary))';
      case 'warning': return 'hsl(var(--dashboard-warning))';
      default: return 'hsl(var(--dashboard-danger))';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Destacados del Mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt="María González" />
                <AvatarFallback className="bg-primary text-primary-foreground">MG</AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">María González</h4>
              <p className="text-sm text-muted-foreground">3 Medallas de Oro - Categoría Senior</p>
              <Badge variant="secondary" className="mt-1">
                <Medal className="h-3 w-3 mr-1" />
                Deportista del Mes
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-sm">Logros Recientes</h5>
            {[
              { text: 'Regional Championship - 1er Lugar', date: '2 días' },
              { text: 'Nuevo récord personal - Ana López', date: '5 días' },
              { text: 'Certificación nivel avanzado - 8 atletas', date: '1 semana' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                <span className="text-sm">{item.text}</span>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {item.date}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle>Estado del Equipamiento</CardTitle>
          <CardDescription>Inventario y disponibilidad actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {equipmentStatus.map((equipment, index) => {
            const percentage = (equipment.available / equipment.total) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{equipment.item}</span>
                  <span className="text-sm text-muted-foreground">
                    {equipment.available}/{equipment.total}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getStatusColor(equipment.status)
                      }}
                    />
                  </div>
                  <Badge 
                    variant={equipment.status === 'warning' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            );
          })}
          
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">142</div>
                <div className="text-xs text-muted-foreground">Disponible</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <div className="text-xs text-muted-foreground">Mantenimiento</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">2</div>
                <div className="text-xs text-muted-foreground">Reparación</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HighlightsSection;