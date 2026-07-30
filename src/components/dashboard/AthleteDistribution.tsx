import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Users, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const CATEGORY_MAP: Record<string, { label: string; color: string; ageRange: string; level: string }> = {
  escuela:    { label: 'Escuela',    color: 'hsl(var(--chart-1))', ageRange: '6-12 años',  level: 'Iniciación' },
  menores:    { label: 'Menores',    color: 'hsl(var(--chart-2))', ageRange: '13-15 años', level: 'Intermedio' },
  transicion: { label: 'Transición', color: 'hsl(var(--chart-3))', ageRange: '16-17 años', level: 'Avanzado' },
  juvenil:    { label: 'Juvenil',    color: 'hsl(var(--chart-4))', ageRange: '13-17 años', level: 'Competitivo' },
  mayores:    { label: 'Mayores',    color: 'hsl(var(--chart-5))', ageRange: '18+ años',   level: 'Profesional' },
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const AthleteDistribution: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categoryData = [] } = useQuery({
    queryKey: ['athlete-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('category')
        .eq('status', 'active');
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const a of data ?? []) counts[a.category] = (counts[a.category] ?? 0) + 1;

      return Object.entries(CATEGORY_MAP).map(([key, meta]) => ({
        name:      key,
        shortName: meta.label,
        value:     counts[key] ?? 0,
        color:     meta.color,
        ageRange:  meta.ageRange,
        level:     meta.level,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: attendanceData = [] } = useQuery({
    queryKey: ['weekly-attendance-chart'],
    queryFn: async () => {
      const now   = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end   = endOfWeek(now,   { weekStartsOn: 1 });

      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select(`id, scheduled_at, training_attendance(id, attended)`)
        .gte('scheduled_at', format(start, 'yyyy-MM-dd'))
        .lte('scheduled_at', format(end, 'yyyy-MM-dd') + 'T23:59:59');

      if (error) throw error;

      const byDay: Record<string, { total: number; attended: number }> = {};
      for (const s of sessions ?? []) {
        const dayName = DAY_NAMES[new Date(s.scheduled_at).getDay()];
        if (!byDay[dayName]) byDay[dayName] = { total: 0, attended: 0 };
        const att = (s as any).training_attendance as { attended: boolean }[];
        byDay[dayName].total    += att.length;
        byDay[dayName].attended += att.filter(a => a.attended).length;
      }

      return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => {
        const d = byDay[day];
        return { day, attendance: d && d.total > 0 ? Math.round((d.attended / d.total) * 100) : 0 };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-dashboard-primary" />
            Distribución por Edad
          </CardTitle>
          <CardDescription>Deportistas activos segmentados por grupos de edad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} deportistas`, 'Total']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {categoryData.map(item => (
              <Button key={item.name} variant={selectedCategory === item.name ? 'default' : 'ghost'}
                className="w-full justify-start p-3 h-auto"
                onClick={() => setSelectedCategory(selectedCategory === item.name ? null : item.name)}>
                <div className="flex items-center gap-3 w-full">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.shortName}</div>
                    <div className="text-xs text-muted-foreground">{item.ageRange}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.level}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-dashboard-secondary" />
            Asistencia Semanal
          </CardTitle>
          <CardDescription>Porcentaje de asistencia por día esta semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" domain={[0, 100]}
                  tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Asistencia']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="attendance" fill="hsl(var(--dashboard-secondary))" radius={[4, 4, 0, 0]}
                  className="cursor-pointer hover:opacity-80 transition-opacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AthleteDistribution;
