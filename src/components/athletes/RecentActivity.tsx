
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Activity {
  athlete_name: string;
  action: string;
  rawDate: Date;
  time: string;
  type: string;
}

type AttendanceRow = {
  created_at: string;
  attended: boolean;
  athletes: { first_name: string; last_name: string };
  training_sessions: { name: string; date: string };
};

type CompRegistrationRow = {
  created_at: string;
  athletes: { first_name: string; last_name: string };
  competitions: { name: string };
};

const RecentActivity = () => {
  const { data: recentActivity = [], isLoading: loading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<Activity[]> => {
      const [attendanceRes, athletesRes, competitionRes] = await Promise.all([
        (supabase
          .from('training_attendance' as never)
          .select('created_at, attended, athletes!inner(first_name, last_name), training_sessions!inner(name, date)')
          .order('created_at', { ascending: false })
          .limit(5)) as unknown as Promise<{ data: AttendanceRow[] | null; error: { message: string } | null }>,
        supabase
          .from('athletes')
          .select('first_name, last_name, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        (supabase
          .from('competition_registrations')
          .select('created_at, athletes!inner(first_name, last_name), competitions!inner(name)')
          .order('created_at', { ascending: false })
          .limit(3)) as unknown as Promise<{ data: CompRegistrationRow[] | null; error: { message: string } | null }>,
      ]);

      if (attendanceRes.error) throw new Error(attendanceRes.error.message);
      if (athletesRes.error) throw athletesRes.error;
      if (competitionRes.error) throw new Error(competitionRes.error.message);

      const activities: Activity[] = [];

      attendanceRes.data?.forEach(item => {
        const rawDate = new Date(item.created_at);
        activities.push({
          athlete_name: `${item.athletes.first_name} ${item.athletes.last_name}`,
          action: item.attended ? 'Entrenamiento completado' : 'Falta registrada',
          rawDate,
          time: formatDistanceToNow(rawDate, { addSuffix: true, locale: es }),
          type: item.attended ? 'training' : 'absence',
        });
      });

      athletesRes.data?.forEach(athlete => {
        const rawDate = new Date(athlete.created_at);
        activities.push({
          athlete_name: `${athlete.first_name} ${athlete.last_name}`,
          action: 'Nuevo atleta registrado',
          rawDate,
          time: formatDistanceToNow(rawDate, { addSuffix: true, locale: es }),
          type: 'registration',
        });
      });

      competitionRes.data?.forEach(item => {
        const rawDate = new Date(item.created_at);
        activities.push({
          athlete_name: `${item.athletes.first_name} ${item.athletes.last_name}`,
          action: `Inscrito en ${item.competitions.name}`,
          rawDate,
          time: formatDistanceToNow(rawDate, { addSuffix: true, locale: es }),
          type: 'competition',
        });
      });

      return activities
        .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
        .slice(0, 6);
    },
    staleTime: 2 * 60 * 1000,
  });

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
                }`} />
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
