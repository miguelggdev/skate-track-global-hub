import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day';
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onNavigate,
  onToday,
  onViewModeChange
}) => {
  const getTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: es });
      case 'week':
        return `Semana del ${format(currentDate, 'd MMMM yyyy', { locale: es })}`;
      case 'day':
        return format(currentDate, 'EEEE, d MMMM yyyy', { locale: es });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: es });
    }
  };

  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-foreground capitalize">
          {getTitle()}
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex bg-muted rounded-lg p-1">
        {['month', 'week', 'day'].map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange(mode as 'month' | 'week' | 'day')}
            className="px-3"
          >
            {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
          </Button>
        ))}
      </div>
    </div>
  );
};