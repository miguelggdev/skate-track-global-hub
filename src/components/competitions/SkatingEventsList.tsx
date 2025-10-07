import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Zap, Palette, Users, Award } from 'lucide-react';

const SKATING_EVENTS = {
  shortTrack: {
    title: 'Velocidad (Pista Corta)',
    icon: Zap,
    color: 'text-blue-500',
    events: [
      { value: 'speed_short_track_500m', label: '500m' },
      { value: 'speed_short_track_1000m', label: '1000m' },
      { value: 'speed_short_track_1500m', label: '1500m' },
    ]
  },
  shortTrackRelay: {
    title: 'Relevos (Pista Corta)',
    icon: Users,
    color: 'text-green-500',
    events: [
      { value: 'relay_5000m_men', label: 'Relevo 5000m Masculino' },
      { value: 'relay_3000m_women', label: 'Relevo 3000m Femenino' },
      { value: 'relay_mixed', label: 'Relevo Mixto' },
    ]
  },
  longTrack: {
    title: 'Velocidad (Pista Larga)',
    icon: Zap,
    color: 'text-purple-500',
    events: [
      { value: 'speed_200m_time_trial', label: '200m Contra Reloj' },
      { value: 'speed_group_500m_distance', label: '500m + Distancia (Grupal)' },
      { value: 'speed_group_1000m', label: '1000m (Grupal)' },
      { value: 'points_race_5000m', label: '5000m por Puntos' },
      { value: 'elimination_10000m', label: '10000m Eliminación' },
    ]
  },
  road: {
    title: 'Pruebas de Ruta',
    icon: Trophy,
    color: 'text-orange-500',
    events: [
      { value: 'road_100m', label: '100m' },
      { value: 'road_500m_distance', label: '500m + Distancia' },
      { value: 'road_1000m', label: '1000m' },
      { value: 'road_5000m', label: '5000m' },
      { value: 'road_10000m', label: '10000m' },
      { value: 'road_15000m_elimination', label: '15000m Eliminación' },
      { value: 'road_marathon_42km', label: '42km Maratón' },
    ]
  },
};

export const SkatingEventsList = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Skating Event Types
        </CardTitle>
        <CardDescription>
          Available event categories in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SKATING_EVENTS).map(([key, category]) => {
            const IconComponent = category.icon;
            return (
              <div key={key} className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${category.color}`} />
                  {category.title}
                </h3>
                <ul className="space-y-1">
                  {category.events.map((event) => (
                    <li key={event.value} className="text-sm text-muted-foreground">
                      {event.label}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
