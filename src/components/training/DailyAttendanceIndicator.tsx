import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type AttendanceRow = { athlete_id: string };

export default function DailyAttendanceIndicator() {
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const { data } = useQuery({
    queryKey: ['daily-attendance', today],
    queryFn: async () => {
      const [sessionsRes, athletesRes] = await Promise.all([
        supabase.from('training_sessions').select('id').eq('date', today),
        supabase.from('athletes').select('id').eq('status', 'active'),
      ]);

      const sessionIds = (sessionsRes.data ?? []).map(s => s.id);
      const athletesCount = (athletesRes.data ?? []).length;

      let presentCount = 0;
      if (sessionIds.length > 0) {
        const attendanceRes = await (supabase
          .from('training_attendance' as never)
          .select('athlete_id')
          .in('training_session_id', sessionIds)
          .eq('attended', true)) as unknown as { data: AttendanceRow[] | null };

        const uniq = new Set((attendanceRes.data ?? []).map(a => a.athlete_id));
        presentCount = uniq.size;
      }

      return { presentCount, athletesCount };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const { presentCount, athletesCount } = data;
  const absent = Math.max(athletesCount - presentCount, 0);
  const rate = athletesCount > 0 ? Math.round((presentCount / athletesCount) * 100) : 0;

  return (
    <Card className="argon-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {absent > 0 ? (
            <AlertCircle className="h-6 w-6 text-red-500" />
          ) : (
            <CheckCircle className="h-6 w-6 text-green-600" />
          )}
          <div>
            <div className="font-semibold">Asistencia de Hoy</div>
            <div className="text-sm text-muted-foreground">
              Presentes: {presentCount} · Ausentes: {absent} · Tasa: {rate}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
