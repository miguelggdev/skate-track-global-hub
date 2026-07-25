import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Users, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AthleteDistribution: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState([
    { 
      name: 'School (6-12)', 
      shortName: 'Escuela',
      value: 0, 
      color: 'hsl(var(--chart-1))',
      ageRange: '6-12 años',
      level: 'Iniciación'
    },
    { 
      name: 'Minors (13-15)', 
      shortName: 'Menores',
      value: 0, 
      color: 'hsl(var(--chart-2))',
      ageRange: '13-15 años',
      level: 'Intermedio'
    },
    { 
      name: 'Transition (16-17)', 
      shortName: 'Transición',
      value: 0, 
      color: 'hsl(var(--chart-3))',
      ageRange: '16-17 años',
      level: 'Avanzado'
    },
    { 
      name: 'Juniors (18-20)', 
      shortName: 'Juvenil',
      value: 0, 
      color: 'hsl(var(--chart-4))',
      ageRange: '13-17 años',
      level: 'Competitivo'
    },
    { 
      name: 'Seniors (21+)', 
      shortName: 'Mayores',
      value: 0, 
      color: 'hsl(var(--chart-5))',
      ageRange: '18+ años',
      level: 'Profesional'
    }
  ]);

  const [attendanceData, setAttendanceData] = useState([
    { day: 'Lun', attendance: 0 },
    { day: 'Mar', attendance: 0 },
    { day: 'Mié', attendance: 0 },
    { day: 'Jue', attendance: 0 },
    { day: 'Vie', attendance: 0 },
    { day: 'Sáb', attendance: 0 },
    { day: 'Dom', attendance: 0 }
  ]);

  // Fetch real athlete distribution data
  useEffect(() => {
    const fetchAthleteDistribution = async () => {
      try {
        const { data: athletes, error } = await supabase
          .from('athletes')
          .select('category')
          .eq('status', 'active');

        if (error) throw error;

        // Count athletes by category
        const counts = athletes.reduce((acc, athlete) => {
          acc[athlete.category] = (acc[athlete.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Update category data with real counts
        setCategoryData(prev => prev.map(category => {
          let dbKey = '';
          switch (category.shortName) {
            case 'Escuela': dbKey = 'escuela'; break;
            case 'Menores': dbKey = 'menores'; break;
            case 'Transición': dbKey = 'transicion'; break;
            case 'Juvenil': dbKey = 'juvenil'; break;
            case 'Mayores': dbKey = 'mayores'; break;
          }
          return { ...category, value: counts[dbKey] || 0 };
        }));
      } catch (error) {
        console.error('Error fetching athlete distribution:', error);
      }
    };

    // Fetch training attendance data for current week
    const fetchAttendanceData = async () => {
      try {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const { data: sessions, error } = await supabase
          .from('training_sessions')
          .select(`
            id,
            date,
            training_attendance(
              id,
              attended
            )
          `)
          .gte('date', startOfWeek.toISOString().split('T')[0])
          .lte('date', endOfWeek.toISOString().split('T')[0]);

        if (error) throw error;

        // Calculate attendance by day
        const dayAttendance = {};
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        sessions?.forEach(session => {
          const sessionDate = new Date(session.date);
          const dayIndex = sessionDate.getDay();
          const dayName = dayNames[dayIndex];
          
          if (!dayAttendance[dayName]) {
            dayAttendance[dayName] = { total: 0, attended: 0 };
          }
          
          dayAttendance[dayName].total += session.training_attendance.length;
          dayAttendance[dayName].attended += session.training_attendance.filter(a => a.attended).length;
        });

        // Update attendance data
        setAttendanceData(prev => prev.map(day => {
          const dayData = dayAttendance[day.day];
          const attendance = dayData && dayData.total > 0 
            ? Math.round((dayData.attended / dayData.total) * 100)
            : 0;
          return { ...day, attendance };
        }));
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    };

    fetchAthleteDistribution();
    fetchAttendanceData();

    // Set up real-time subscriptions
    const athletesChannel = supabase
      .channel('athletes-distribution-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'athletes' }, fetchAthleteDistribution)
      .subscribe();

    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_attendance' }, fetchAttendanceData)
      .subscribe();

    return () => {
      supabase.removeChannel(athletesChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

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
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} deportistas`, 'Total']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {categoryData.map((item) => (
              <Button
                key={item.name}
                variant={selectedCategory === item.name ? "default" : "ghost"}
                className="w-full justify-start p-3 h-auto"
                onClick={() => setSelectedCategory(selectedCategory === item.name ? null : item.name)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
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
          <CardDescription>Porcentaje de asistencia por día con comparación semanal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Asistencia']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="attendance" 
                  fill="hsl(var(--dashboard-secondary))"
                  radius={[4, 4, 0, 0]}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AthleteDistribution;