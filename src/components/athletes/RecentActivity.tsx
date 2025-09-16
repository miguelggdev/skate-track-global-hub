
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Activity {
  athlete_name: string;
  action: string;
  time: string;
  type: string;
}

const RecentActivity = () => {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Get recent training attendance
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('training_attendance')
          .select(`
            created_at,
            attended,
            athletes!inner(first_name, last_name),
            training_sessions!inner(name, date)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (attendanceError) throw attendanceError;

        // Get recently created athletes
        const { data: newAthletes, error: athletesError } = await supabase
          .from('athletes')
          .select('first_name, last_name, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        if (athletesError) throw athletesError;

        // Get recent competition registrations
        const { data: competitionData, error: competitionError } = await supabase
          .from('competition_registrations')
          .select(`
            created_at,
            athletes!inner(first_name, last_name),
            competitions!inner(name)
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        if (competitionError) throw competitionError;

        // Combine and format activities
        const activities: Activity[] = [];

        // Add training activities
        attendanceData?.forEach(item => {
          activities.push({
            athlete_name: `${item.athletes.first_name} ${item.athletes.last_name}`,
            action: item.attended ? 'Entrenamiento completado' : 'Falta registrada',
            time: formatDistanceToNow(new Date(item.created_at), { 
              addSuffix: true, 
              locale: es 
            }),
            type: item.attended ? 'training' : 'absence'
          });
        });

        // Add new athlete registrations
        newAthletes?.forEach(athlete => {
          activities.push({
            athlete_name: `${athlete.first_name} ${athlete.last_name}`,
            action: 'Nuevo atleta registrado',
            time: formatDistanceToNow(new Date(athlete.created_at), { 
              addSuffix: true, 
              locale: es 
            }),
            type: 'registration'
          });
        });

        // Add competition registrations
        competitionData?.forEach(item => {
          activities.push({
            athlete_name: `${item.athletes.first_name} ${item.athletes.last_name}`,
            action: `Inscrito en ${item.competitions.name}`,
            time: formatDistanceToNow(new Date(item.created_at), { 
              addSuffix: true, 
              locale: es 
            }),
            type: 'competition'
          });
        });

        // Sort by most recent and take top 6
        const sortedActivities = activities
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 6);

        setRecentActivity(sortedActivities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        // Fallback to empty array
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();

    // Set up real-time subscription
    const channel = supabase
      .channel('recent-activity-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_attendance' }, fetchRecentActivity)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'athletes' }, fetchRecentActivity)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'competition_registrations' }, fetchRecentActivity)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card className="xl:col-span-1 argon-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="xl:col-span-1 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500">No hay actividad reciente.</p>
        ) : (
          recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  activity.type === 'training' ? 'bg-blue-500' :
                  activity.type === 'absence' ? 'bg-red-500' :
                  activity.type === 'registration' ? 'bg-green-500' :
                  activity.type === 'competition' ? 'bg-orange-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">{activity.athlete_name}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.action}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{activity.time}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
