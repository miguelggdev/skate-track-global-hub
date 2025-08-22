import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrainingSession {
  id: string;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
  training_type: 'technical' | 'physical' | 'mental' | 'recovery' | 'gym' | 'road_skating' | 'track_skating' | 'bicycle' | 'static_bicycle' | 'simulator';
  coach_id: string;
  created_at: string;
  updated_at: string;
}

interface CalendarViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CalendarViewDialog: React.FC<CalendarViewDialogProps> = ({ open, onOpenChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const weekStartsOn: 0 | 1 = 0;

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [currentDate, open]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn });
      const endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn });

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones de entrenamiento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTrainingTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-500';
      case 'physical': return 'bg-green-500';
      case 'mental': return 'bg-purple-500';
      case 'recovery': return 'bg-orange-500';
      case 'gym': return 'bg-red-500';
      case 'road_skating': return 'bg-cyan-500';
      case 'track_skating': return 'bg-indigo-500';
      case 'bicycle': return 'bg-yellow-500';
      case 'static_bicycle': return 'bg-amber-500';
      case 'simulator': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrainingTypeLabel = (type: string) => {
    switch (type) {
      case 'technical': return 'Técnico';
      case 'physical': return 'Físico';
      case 'mental': return 'Mental';
      case 'recovery': return 'Recuperación';
      case 'gym': return 'Gimnasio';
      case 'road_skating': return 'Patinaje en Ruta';
      case 'track_skating': return 'Patinaje en Pista';
      case 'bicycle': return 'Bicicleta';
      case 'static_bicycle': return 'Bicicleta Estática';
      case 'simulator': return 'Simulador';
      default: return type;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn });
    const endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn });
    const days = [];
    
    let day = new Date(startDate);
    while (day <= endDate) {
      days.push(new Date(day));
      day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return days;
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(session => session.date === dateStr);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de Entrenamientos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
                      <div key={index} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((date, index) => {
                      const daySessions = getSessionsForDate(date);
                      const isCurrentMonthDay = isCurrentMonth(date);
                      const isTodayDate = isToday(date);

                      return (
                        <div
                          key={index}
                          className={`
                            min-h-[80px] p-1 border rounded-lg transition-colors
                            ${isCurrentMonthDay ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                            ${isTodayDate ? 'bg-blue-50 border-blue-300' : ''}
                          `}
                        >
                          <div className={`
                            text-sm font-medium mb-1
                            ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}
                            ${isTodayDate ? 'text-blue-600' : ''}
                          `}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {daySessions.slice(0, 2).map((session) => (
                              <div
                                key={session.id}
                                className={`
                                  px-1 py-0.5 rounded text-xs text-white truncate
                                  ${getTrainingTypeColor(session.training_type)}
                                `}
                                title={`${session.name} - ${session.start_time}`}
                              >
                                {session.start_time} {session.name}
                              </div>
                            ))}
                            {daySessions.length > 2 && (
                              <div className="text-xs text-gray-500 px-1">
                                +{daySessions.length - 2} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Técnico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Físico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="text-sm">Mental</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm">Recuperación</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Gimnasio</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarViewDialog;