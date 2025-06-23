
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Activity {
  athlete: string;
  action: string;
  time: string;
  type: string;
}

const RecentActivity = () => {
  const recentActivity: Activity[] = [
    { athlete: "Juan Pérez", action: "Training completed", time: "2h ago", type: "training" },
    { athlete: "María García", action: "New personal record", time: "4h ago", type: "achievement" },
    { athlete: "Carlos Rodríguez", action: "Competition registered", time: "1d ago", type: "competition" },
    { athlete: "Ana López", action: "Profile updated", time: "2d ago", type: "update" },
  ];

  return (
    <Card className="xl:col-span-1 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        {recentActivity.map((activity, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                activity.type === 'training' ? 'bg-blue-500' :
                activity.type === 'achievement' ? 'bg-green-500' :
                activity.type === 'competition' ? 'bg-orange-500' :
                'bg-gray-500'
              }`}></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 text-sm truncate">{activity.athlete}</p>
                <p className="text-sm text-gray-600 truncate">{activity.action}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{activity.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
