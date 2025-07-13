import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp } from 'lucide-react';

interface HeatmapData {
  day: string;
  hour: number;
  intensity: number; // 0-100
  attendance: number;
}

const TrainingHeatmap: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  // Generate realistic training heatmap data
  const generateHeatmapData = (): HeatmapData[] => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
    const data: HeatmapData[] = [];

    days.forEach(day => {
      hours.forEach(hour => {
        let intensity = 0;
        let attendance = 0;

        // Peak training hours: 16-20 (4-8 PM)
        if (hour >= 16 && hour <= 20) {
          intensity = Math.floor(Math.random() * 40 + 60); // 60-100%
          attendance = Math.floor(Math.random() * 20 + 15); // 15-35 athletes
        }
        // Morning hours: 8-12
        else if (hour >= 8 && hour <= 12) {
          intensity = Math.floor(Math.random() * 30 + 30); // 30-60%
          attendance = Math.floor(Math.random() * 10 + 5); // 5-15 athletes
        }
        // Evening hours: 20-22
        else if (hour >= 20 && hour <= 22) {
          intensity = Math.floor(Math.random() * 25 + 25); // 25-50%
          attendance = Math.floor(Math.random() * 8 + 3); // 3-11 athletes
        }
        // Off-peak hours
        else {
          intensity = Math.floor(Math.random() * 20); // 0-20%
          attendance = Math.floor(Math.random() * 5); // 0-5 athletes
        }

        // Weekend adjustments
        if (day === 'Sáb' || day === 'Dom') {
          if (hour >= 10 && hour <= 18) {
            intensity = Math.min(intensity + 20, 100);
            attendance = Math.floor(attendance * 1.3);
          }
        }

        data.push({ day, hour, intensity, attendance });
      });
    });

    return data;
  };

  const heatmapData = generateHeatmapData();

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-dashboard-primary';
    if (intensity >= 60) return 'bg-dashboard-secondary opacity-80';
    if (intensity >= 40) return 'bg-dashboard-accent opacity-60';
    if (intensity >= 20) return 'bg-dashboard-accent opacity-40';
    return 'bg-dashboard-neutral opacity-30';
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-dashboard-primary" />
              Mapa de Calor - Entrenamientos
            </CardTitle>
            <CardDescription>Intensidad de entrenamientos por horario y día</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semanal
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mensual
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="relative">
            {/* Hour labels */}
            <div className="grid grid-cols-15 gap-1 mb-2">
              <div className="w-12"></div> {/* Empty corner */}
              {hours.map(hour => (
                <div key={hour} className="text-xs text-center text-muted-foreground">
                  {hour}h
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {days.map(day => (
              <div key={day} className="grid grid-cols-15 gap-1 mb-1">
                <div className="w-12 text-xs text-right pr-2 text-muted-foreground flex items-center">
                  {day}
                </div>
                {hours.map(hour => {
                  const dataPoint = heatmapData.find(d => d.day === day && d.hour === hour);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`h-6 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md ${getIntensityColor(dataPoint?.intensity || 0)}`}
                      title={`${day} ${hour}:00 - ${dataPoint?.attendance || 0} atletas (${dataPoint?.intensity || 0}% intensidad)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend and Stats */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Intensidad:</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-dashboard-neutral opacity-30"></div>
                <span className="text-xs">Baja</span>
                <div className="h-3 w-3 rounded bg-dashboard-accent opacity-60"></div>
                <span className="text-xs">Media</span>
                <div className="h-3 w-3 rounded bg-dashboard-secondary opacity-80"></div>
                <span className="text-xs">Alta</span>
                <div className="h-3 w-3 rounded bg-dashboard-primary"></div>
                <span className="text-xs">Máxima</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-dashboard-success" />
                <span className="font-medium">Horario pico: 16:00-20:00</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingHeatmap;