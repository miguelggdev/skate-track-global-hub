import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Zap, Palette, Users, Award } from 'lucide-react';

const SKATING_EVENTS = {
  speed: [
    { value: 'speed_100m', label: '100m' },
    { value: 'speed_200m', label: '200m' },
    { value: 'speed_300m', label: '300m' },
    { value: 'speed_500m', label: '500m' },
    { value: 'speed_1000m', label: '1000m' },
    { value: 'speed_1500m', label: '1500m' },
    { value: 'speed_3000m', label: '3000m' },
    { value: 'speed_5000m', label: '5000m' },
    { value: 'speed_10000m', label: '10000m' },
    { value: 'speed_15000m', label: '15000m' },
    { value: 'speed_20000m', label: '20000m' },
  ],
  artistic: [
    { value: 'artistic_figures', label: 'Figures' },
    { value: 'artistic_freestyle', label: 'Freestyle' },
    { value: 'artistic_pairs', label: 'Pairs' },
    { value: 'artistic_dance', label: 'Dance' },
  ],
  relay: [
    { value: 'relay_4x100m', label: '4x100m' },
    { value: 'relay_4x200m', label: '4x200m' },
  ],
  other: [
    { value: 'marathon', label: 'Marathon' },
    { value: 'elimination', label: 'Elimination' },
    { value: 'points_race', label: 'Points Race' },
  ],
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
          {/* Speed Events */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Speed Events
            </h3>
            <ul className="space-y-1">
              {SKATING_EVENTS.speed.map((event) => (
                <li key={event.value} className="text-sm text-muted-foreground">
                  {event.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Artistic Events */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-500" />
              Artistic Events
            </h3>
            <ul className="space-y-1">
              {SKATING_EVENTS.artistic.map((event) => (
                <li key={event.value} className="text-sm text-muted-foreground">
                  {event.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Relay Events */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Relay Events
            </h3>
            <ul className="space-y-1">
              {SKATING_EVENTS.relay.map((event) => (
                <li key={event.value} className="text-sm text-muted-foreground">
                  {event.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Other Events */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-orange-500" />
              Other Events
            </h3>
            <ul className="space-y-1">
              {SKATING_EVENTS.other.map((event) => (
                <li key={event.value} className="text-sm text-muted-foreground">
                  {event.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
