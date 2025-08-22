import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CalendarEvent {
  id: string;
  title: string;
  day: string; // 'monday', 'tuesday', etc.
  startTime: string; // '08:00'
  endTime?: string; // '09:00'
  type?: string;
}

interface WeeklyCalendarTableProps {
  baseDate?: Date;
  events?: CalendarEvent[];
  className?: string;
}

export const WeeklyCalendarTable: React.FC<WeeklyCalendarTableProps> = ({
  baseDate = new Date(),
  events = [],
  className = ""
}) => {
  // Generate hours from 6 AM to 10 PM
  const hours = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      display: hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`
    };
  });

  // Get the week starting from Monday
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      name: format(date, 'EEEE', { locale: es }),
      shortName: format(date, 'EEE', { locale: es }),
      dayNumber: format(date, 'd'),
      isToday: isSameDay(date, new Date())
    };
  });

  // Map day names to indices for event placement
  const dayNameMap: { [key: string]: number } = {
    'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
    'friday': 4, 'saturday': 5, 'sunday': 6,
    'lunes': 0, 'martes': 1, 'miércoles': 2, 'jueves': 3,
    'viernes': 4, 'sábado': 5, 'domingo': 6
  };

  // Get events for a specific day and time
  const getEventsForSlot = (dayIndex: number, time: string) => {
    return events.filter(event => {
      const eventDayIndex = dayNameMap[event.day.toLowerCase()];
      return eventDayIndex === dayIndex && event.startTime === time;
    });
  };

  return (
    <div className={`w-full overflow-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 text-center font-semibold">Hora</TableHead>
            {days.map((day, index) => (
              <TableHead key={index} className="text-center font-semibold min-w-32">
                <div className="flex flex-col items-center gap-1">
                  <span className={day.isToday ? "font-bold text-primary" : ""}>
                    {day.shortName}
                    {day.isToday && " *"}
                  </span>
                  <span className={`text-sm ${day.isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {day.dayNumber}
                  </span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {hours.map((hour, hourIndex) => (
            <TableRow key={hourIndex} className="hover:bg-muted/30">
              <TableCell className="text-center font-medium text-sm border-r">
                {hour.display}
              </TableCell>
              {days.map((day, dayIndex) => {
                const slotEvents = getEventsForSlot(dayIndex, hour.time);
                return (
                  <TableCell key={dayIndex} className="p-2 border-r relative min-h-12">
                    {slotEvents.map((event, eventIndex) => (
                      <div
                        key={event.id}
                        className="bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs mb-1 last:mb-0"
                      >
                        <div className="font-medium text-primary truncate">
                          {event.title}
                        </div>
                        {event.endTime && (
                          <div className="text-muted-foreground">
                            {hour.time} - {event.endTime}
                          </div>
                        )}
                      </div>
                    ))}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};