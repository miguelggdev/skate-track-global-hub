import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserProfile } from '@/hooks/useUserProfile';
import { CalendarHeader } from '@/components/training/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/training/calendar/CalendarGrid';
import { EventModal } from '@/components/training/calendar/EventModal';
import CreateTrainingDialog from '@/components/training/CreateTrainingDialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Filter,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

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

const TrainingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();
  const { isAdmin } = useUserProfile();
  const weekStartsOn: 0 | 1 = 0;

  // Load training sessions
  useEffect(() => {
    loadSessions();
  }, [currentDate, viewMode]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'month') {
        startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn });
        endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn });
      } else if (viewMode === 'week') {
        startDate = startOfWeek(currentDate, { weekStartsOn });
        endDate = endOfWeek(currentDate, { weekStartsOn });
      } else {
        startDate = new Date(currentDate);
        endDate = new Date(currentDate);
      }

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

  const filteredSessions = sessions.filter(session => 
    filterType === 'all' || session.training_type === filterType
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const daySessionsExist = filteredSessions.some(session => 
      format(new Date(session.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (daySessionsExist && viewMode === 'month') {
      setViewMode('day');
      setCurrentDate(date);
    }
  };

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowEventModal(true);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <DashboardLayout title="Calendario de Entrenamientos">
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h1>
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

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            {/* View Mode Selector */}
            <div className="flex bg-muted rounded-lg p-1">
              {['month', 'week', 'day'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode as any)}
                  className="px-3"
                >
                  {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
                </Button>
              ))}
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background"
            >
              <option value="all">Todos los tipos</option>
              <option value="technical">Técnico</option>
              <option value="physical">Físico</option>
              <option value="mental">Mental</option>
              <option value="recovery">Recuperación</option>
              <option value="gym">Gimnasio</option>
              <option value="road_skating">Patinaje en Ruta</option>
              <option value="track_skating">Patinaje en Pista</option>
              <option value="bicycle">Bicicleta</option>
              <option value="static_bicycle">Bicicleta Estática</option>
              <option value="simulator">Simulador</option>
            </select>

            {isAdmin && (
              <CreateTrainingDialog>
                <Button className="bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Entrenamiento
                </Button>
              </CreateTrainingDialog>
            )}
          </div>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
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
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                <span className="text-sm">Patinaje en Ruta</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                <span className="text-sm">Patinaje en Pista</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm">Bicicleta</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded"></div>
                <span className="text-sm">Bicicleta Estática</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-pink-500 rounded"></div>
                <span className="text-sm">Simulador</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <CalendarGrid
          currentDate={currentDate}
          viewMode={viewMode}
          sessions={filteredSessions}
          onDateClick={handleDateClick}
          onSessionClick={handleSessionClick}
          getTrainingTypeColor={getTrainingTypeColor}
          getTrainingTypeLabel={getTrainingTypeLabel}
          isLoading={isLoading}
          weekStartsOn={weekStartsOn}
        />

        {/* Event Details Modal */}
        <EventModal
          session={selectedSession}
          open={showEventModal}
          onOpenChange={setShowEventModal}
          onSessionUpdate={loadSessions}
        />
      </div>
    </DashboardLayout>
  );
};

export default TrainingCalendar;