import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Users, Clock, Activity, BarChart3 } from 'lucide-react';
import { useTrainingHeatmap } from '@/hooks/useTrainingHeatmap';

const TrainingHeatmap: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const { heatmapData, statistics, isLoading, error } = useTrainingHeatmap(viewMode);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 75) return 'bg-red-500 shadow-sm'; // Very high activity
    if (intensity >= 50) return 'bg-orange-400'; // High activity  
    if (intensity >= 25) return 'bg-yellow-300'; // Medium activity
    if (intensity >= 10) return 'bg-blue-200'; // Low activity
    if (intensity > 0) return 'bg-gray-200'; // Minimal activity
    return 'bg-gray-100 border border-gray-200'; // No activity
  };

  const getIntensityTooltip = (data: any) => {
    if (data.sessionCount === 0) {
      return `${data.day} ${data.hour}:00 - Sin entrenamientos`;
    }
    return `${data.day} ${data.hour}:00\n${data.sessionCount} sesión(es)\n${data.totalAttendance} asistencias\nPromedio: ${data.averageAttendance} atletas`;
  };

  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (isLoading) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mapa de Calor - Entrenamientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mapa de Calor - Entrenamientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Error al cargar los datos del mapa de calor
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <CardHeader>
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Mapa de Calor - Entrenamientos
            </CardTitle>
            <CardDescription>
              Actividad de entrenamientos por horario y día ({viewMode === 'week' ? 'Esta semana' : 'Este mes'})
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Semanal
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              <Activity className="h-4 w-4 mr-1" />
              Mensual
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Total Sesiones</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{statistics.totalSessions}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Total Asistencias</span>
            </div>
            <p className="text-xl font-bold text-green-900">{statistics.totalAttendance}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Hora Pico</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{statistics.peakHour}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Promedio/Sesión</span>
            </div>
            <p className="text-lg font-bold text-orange-900">{statistics.averageAttendance}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {heatmapData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No hay datos de entrenamientos</p>
              <p className="text-sm">Crea sesiones de entrenamiento para ver el mapa de calor</p>
            </div>
          ) : (
            <>
              {/* Heatmap Grid */}
              <div className="relative overflow-x-auto">
                {/* Hour labels */}
                <div className="flex mb-2">
                  <div className="w-12 flex-shrink-0"></div> {/* Empty corner */}
                  <div className="flex gap-1 min-w-max">
                    {hours.map(hour => (
                      <div key={hour} className="w-8 text-xs text-center text-muted-foreground">
                        {hour}h
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmap rows */}
                <div className="space-y-1">
                  {days.map(day => (
                    <div key={day} className="flex">
                      <div className="w-12 flex-shrink-0 text-xs text-right pr-2 text-muted-foreground flex items-center">
                        {day}
                      </div>
                      <div className="flex gap-1 min-w-max">
                        {hours.map(hour => {
                          const dataPoint = heatmapData.find(d => d.day === day && d.hour === hour);
                          return (
                            <div
                              key={`${day}-${hour}`}
                              className={`w-8 h-6 rounded-sm cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border ${getIntensityColor(dataPoint?.intensity || 0)}`}
                              title={getIntensityTooltip(dataPoint || { day, hour, sessionCount: 0, totalAttendance: 0, averageAttendance: 0 })}
                            >
                              {dataPoint && dataPoint.sessionCount > 0 && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {dataPoint.sessionCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend and Insights */}
              <div className="space-y-4 pt-4 border-t">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Actividad:</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded bg-gray-100 border border-gray-200"></div>
                      <span className="text-xs">Sin actividad</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded bg-blue-200"></div>
                      <span className="text-xs">Baja</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded bg-yellow-300"></div>
                      <span className="text-xs">Media</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded bg-orange-400"></div>
                      <span className="text-xs">Alta</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded bg-red-500"></div>
                      <span className="text-xs">Muy alta</span>
                    </div>
                  </div>
                </div>
                
                {/* Insights */}
                {statistics.busiest.count > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Horario más ocupado: {statistics.busiest.day} {statistics.busiest.hour}:00
                    </Badge>
                    {statistics.peakDay !== 'N/A' && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Día más activo: {statistics.peakDay}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingHeatmap;