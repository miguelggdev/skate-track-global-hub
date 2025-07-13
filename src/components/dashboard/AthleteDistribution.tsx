import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Users, BarChart3 } from 'lucide-react';

// Age-based categories as specified in requirements
const categoryData = [
  { 
    name: 'School (6-12)', 
    shortName: 'School',
    value: 5, 
    color: 'hsl(var(--chart-1))',
    ageRange: '6-12 años',
    level: 'Iniciación'
  },
  { 
    name: 'Juniors (13-15)', 
    shortName: 'Juniors',
    value: 5, 
    color: 'hsl(var(--chart-2))',
    ageRange: '13-15 años',
    level: 'Intermedio/Avanzado'
  },
  { 
    name: 'Transition (16-17)', 
    shortName: 'Transition',
    value: 5, 
    color: 'hsl(var(--chart-3))',
    ageRange: '16-17 años',
    level: 'Avanzado/Pro'
  },
  { 
    name: 'Seniors (18+)', 
    shortName: 'Seniors',
    value: 7, 
    color: 'hsl(var(--chart-4))',
    ageRange: '18+ años',
    level: 'Profesional'
  }
];

const attendanceData = [
  { day: 'Lun', attendance: 85 },
  { day: 'Mar', attendance: 92 },
  { day: 'Mié', attendance: 78 },
  { day: 'Jue', attendance: 88 },
  { day: 'Vie', attendance: 82 },
  { day: 'Sáb', attendance: 95 },
  { day: 'Dom', attendance: 73 }
];

const AthleteDistribution: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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