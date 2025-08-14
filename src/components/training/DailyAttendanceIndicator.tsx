import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function DailyAttendanceIndicator() {
  const [presentCount, setPresentCount] = useState<number | null>(null);
  const [athletesCount, setAthletesCount] = useState<number | null>(null);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    const run = async () => {
      // Get today's session ids
      const { data: sessions } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('date', today);

      const sessionIds = (sessions || []).map(s => s.id);

      // Count unique present athletes today
      let present = 0;
      if (sessionIds.length > 0) {
        const { data: attendance } = await supabase
          .from('training_attendance')
          .select('athlete_id, attended, training_session_id')
          .in('training_session_id', sessionIds)
          .eq('attended', true);
        const uniq = new Set((attendance || []).map(a => a.athlete_id));
        present = uniq.size;
      }

      const { data: athletes } = await supabase
        .from('athletes')
        .select('id', { count: 'exact', head: false })
        .eq('status', 'active');

      setPresentCount(present);
      setAthletesCount((athletes || []).length);
    };
    run();
  }, [today]);

  if (presentCount === null || athletesCount === null) return null;

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
            <div className="font-semibold">Today's Attendance</div>
            <div className="text-sm text-muted-foreground">Present: {presentCount} · Absent: {absent} · Rate: {rate}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
