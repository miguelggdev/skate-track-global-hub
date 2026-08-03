import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, UserCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GenderDistributionProps {
  maleAthletes?: number;
  femaleAthletes?: number;
  totalAthletes?: number;
}

const GenderDistributionChart: React.FC<GenderDistributionProps> = ({
  maleAthletes = 0,
  femaleAthletes = 0,
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [displayedData, setDisplayedData] = useState([
    { name: 'Masculino', value: 0, color: 'hsl(var(--primary))', icon: User },
    { name: 'Femenino',  value: 0, color: 'hsl(var(--accent))',  icon: UserCircle2 },
  ]);

  const { data } = useQuery({
    queryKey: ['athletes-gender'],
    queryFn: async () => {
      const [maleRes, femaleRes] = await Promise.all([
        supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('gender', 'masculino'),
        supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('gender', 'femenino'),
      ]);
      return { male: maleRes.count ?? 0, female: femaleRes.count ?? 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const male   = data?.male   ?? maleAthletes;
  const female = data?.female ?? femaleAthletes;
  const total  = male + female;

  const finalData = [
    { name: 'Masculino', value: male,   color: 'hsl(var(--primary))', icon: User },
    { name: 'Femenino',  value: female, color: 'hsl(var(--accent))',  icon: UserCircle2 },
  ];

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const animate = () => {
      if (currentStep <= steps) {
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayedData([
          { name: 'Masculino', value: Math.round(male   * eased), color: 'hsl(var(--primary))', icon: User },
          { name: 'Femenino',  value: Math.round(female * eased), color: 'hsl(var(--accent))',  icon: UserCircle2 },
        ]);
        currentStep++;
        setTimeout(animate, stepDuration);
      } else {
        setAnimationComplete(true);
      }
    };

    animate();
  }, [male, female]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const pct = total ? Math.round((d.value / total) * 100) : 0;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-white">{d.payload.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {d.value} deportistas ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="xl:col-span-1 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Distribución por Género</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        {total === 0 ? (
          <p className="text-sm text-gray-500">Sin datos de género disponibles.</p>
        ) : (
          <>
            <div className="h-20 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayedData}
                    cx="50%"
                    cy="50%"
                    outerRadius={35}
                    dataKey="value"
                    animationDuration={0}
                  >
                    {displayedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {finalData.map((item, index) => {
              const pct = total ? Math.round((item.value / total) * 100) : 0;
              const displayValue = displayedData[index]?.value ?? 0;
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm truncate flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{displayValue} deportistas</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{pct}%</span>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GenderDistributionChart;
