import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, isSameMonth, isToday, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
  max_athletes?: number;
  training_type: 'technical' | 'physical' | 'mental' | 'recovery' | 'gym' | 'road_skating' | 'track_skating' | 'bicycle' | 'static_bicycle' | 'simulator';
  coach_id: string;
}

interface CalendarGridProps {
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day';
  sessions: TrainingSession[];
  onDateClick: (date: Date) => void;
  onSessionClick: (session: TrainingSession) => void;
  getTrainingTypeColor: (type: string) => string;
  getTrainingTypeLabel: (type: string) => string;
  isLoading: boolean;
  weekStartsOn?: 0 | 1;
}

const sessionStartHour = (s: TrainingSession) => new Date(s.scheduled_at).getHours();
const sessionEndHour = (s: TrainingSession) => {
  const start = new Date(s.scheduled_at);
  return new Date(start.getTime() + (s.duration_minutes || 60) * 60_000).getHours();
};
const sessionTimeLabel = (s: TrainingSession) => {
  const start = new Date(s.scheduled_at);
  const end = new Date(start.getTime() + (s.duration_minutes || 60) * 60_000);
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  viewMode,
  sessions,
  onDateClick,
  onSessionClick,
  getTrainingTypeColor,
  getTrainingTypeLabel,
  isLoading,
  weekStartsOn = 0
}) => {
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = weekStartsOn === 1
      ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div key={day} className="p-4 text-center font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const daySessions = sessions.filter(session =>
                isSameDay(new Date(session.scheduled_at), day)
              );

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors",
                    !isSameMonth(day, currentDate) && "bg-muted/20 text-muted-foreground",
                    isToday(day) && "bg-primary/10 border-primary"
                  )}
                  onClick={() => onDateClick(day)}
                >
                  <div className={cn("text-sm font-medium mb-2", isToday(day) && "text-primary font-bold")}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {daySessions.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity",
                          getTrainingTypeColor(session.training_type)
                        )}
                        onClick={(e) => { e.stopPropagation(); onSessionClick(session); }}
                      >
                        <div className="truncate font-medium">{format(new Date(session.scheduled_at), 'HH:mm')}</div>
                        <div className="truncate">{session.title}</div>
                      </div>
                    ))}

                    {daySessions.length > 3 && (
                      <div className="text-xs text-muted-foreground">+{daySessions.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6); // 6–22

    return (
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            <div className="p-4 border-r"></div>
            {days.map((day) => (
              <div
                key={day.toString()}
                className="p-4 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/50"
                onClick={() => onDateClick(day)}
              >
                <div className="font-medium">{format(day, 'EEE', { locale: es })}</div>
                <div className={cn("text-2xl", isToday(day) && "text-primary font-bold", isSameDay(day, currentDate) && "text-primary font-bold")}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-b-0 min-h-[60px]">
                <div className="p-2 border-r text-sm text-muted-foreground">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
                {days.map((day) => {
                  const daySessions = sessions.filter(session =>
                    isSameDay(new Date(session.scheduled_at), day) &&
                    sessionStartHour(session) <= hour &&
                    sessionEndHour(session) > hour
                  );

                  return (
                    <div key={`${day}-${hour}`} className="p-1 border-r last:border-r-0 relative">
                      {daySessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "text-xs p-2 rounded text-white cursor-pointer hover:opacity-80 transition-opacity mb-1",
                            getTrainingTypeColor(session.training_type)
                          )}
                          onClick={() => onSessionClick(session)}
                        >
                          <div className="font-medium truncate">{session.title}</div>
                          <div className="truncate">{sessionTimeLabel(session)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDayView = () => {
    const daySessions = sessions.filter(session =>
      isSameDay(new Date(session.scheduled_at), currentDate)
    );

    const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);

    return (
      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4">
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </h3>
            <p className="text-muted-foreground">{daySessions.length} entrenamientos programados</p>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((hour) => {
              const timeSessions = daySessions.filter(session =>
                sessionStartHour(session) <= hour && sessionEndHour(session) > hour
              );

              return (
                <div key={hour} className="grid grid-cols-12 border-b last:border-b-0 min-h-[60px]">
                  <div className="col-span-2 p-4 border-r text-muted-foreground">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </div>
                  <div className="col-span-10 p-2">
                    {timeSessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "p-3 rounded-lg text-white cursor-pointer hover:opacity-80 transition-opacity mb-2",
                          getTrainingTypeColor(session.training_type)
                        )}
                        onClick={() => onSessionClick(session)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{session.title}</h4>
                            <p className="text-sm opacity-90">{sessionTimeLabel(session)}</p>
                            {session.location && (
                              <p className="text-sm opacity-75">{session.location}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {getTrainingTypeLabel(session.training_type)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Cargando calendario...</div>
        </CardContent>
      </Card>
    );
  }

  switch (viewMode) {
    case 'month': return renderMonthView();
    case 'week':  return renderWeekView();
    case 'day':   return renderDayView();
    default:      return renderMonthView();
  }
};
