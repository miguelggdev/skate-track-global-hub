import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UpcomingEvent {
  name: string;
  date: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

const UpcomingEvents = () => {
  const upcomingEvents: UpcomingEvent[] = [
    { name: "Winter Speed Championship", date: "Feb 15", time: "09:00 AM", priority: "high" },
    { name: "Regional Speed Trials", date: "Jan 28", time: "10:30 AM", priority: "medium" },
    { name: "Training Camp Selection", date: "Feb 01", time: "02:00 PM", priority: "high" },
    { name: "Equipment Check", date: "Jan 25", time: "08:00 AM", priority: "low" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.map((event, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)}`}></div>
              <div>
                <p className="font-medium text-gray-800">{event.name}</p>
                <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;