import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpcomingCompetitions } from '@/hooks/useCompetitions';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const UpcomingEvents = () => {
  const { data: competitions = [], isLoading, error } = useUpcomingCompetitions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration-open': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'ongoing': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getDaysUntil = (startDate: string) => {
    const today = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-red-500 text-sm">Error loading events</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500 text-sm">No upcoming events</p>
          </div>
        ) : (
          competitions.slice(0, 5).map((competition) => {
            const daysUntil = getDaysUntil(competition.start_date);
            return (
              <div key={competition.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(competition.status)}`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{competition.name}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(competition.start_date), 'MMM dd')} 
                      {daysUntil >= 0 ? ` (${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`})` : ' (Past)'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;