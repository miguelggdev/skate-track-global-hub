import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Baby, ArrowRight, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryDistributionProps {
  escuelaAthletes?: number;
  menoresAthletes?: number;
  transicionAthletes?: number;
  mayoresAthletes?: number;
  juvenilAthletes?: number;
  totalAthletes?: number;
}

const CategoryDistributionChart: React.FC<CategoryDistributionProps> = ({
  escuelaAthletes = 0,
  menoresAthletes = 0,
  transicionAthletes = 0,
  mayoresAthletes = 0,
  juvenilAthletes = 0,
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [displayedData, setDisplayedData] = useState([
    { name: 'Escuela',    value: 0, color: 'hsl(var(--primary))',          icon: GraduationCap },
    { name: 'Menores',    value: 0, color: 'hsl(var(--secondary))',         icon: Baby },
    { name: 'Transición', value: 0, color: 'hsl(var(--accent))',            icon: ArrowRight },
    { name: 'Mayores',    value: 0, color: 'hsl(var(--muted-foreground))',  icon: Crown },
  ]);

  const { data: counts } = useQuery({
    queryKey: ['athletes-category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('category')
        .eq('status', 'active');
      if (error) throw error;

      return (data ?? []).reduce((acc, a) => {
        acc[a.category] = (acc[a.category] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
    staleTime: 5 * 60 * 1000,
  });

  const schoolAthletes     = counts?.['escuela']   ?? escuelaAthletes;
  const minorsAthletes     = counts?.['menores']   ?? menoresAthletes;
  const transitionAthletes = counts?.['transicion'] ?? transicionAthletes;
  const seniorsAthletes    =
    (counts?.['mayores']  ?? mayoresAthletes) +
    (counts?.['juvenil']  ?? juvenilAthletes) +
    (counts?.['senior']   ?? 0) +
    (counts?.['masters']  ?? 0);

  const total = schoolAthletes + minorsAthletes + transitionAthletes + seniorsAthletes;

  const finalData = [
    { name: 'Escuela',    value: schoolAthletes,     color: 'hsl(var(--primary))',         icon: GraduationCap },
    { name: 'Menores',    value: minorsAthletes,     color: 'hsl(var(--secondary))',        icon: Baby },
    { name: 'Transición', value: transitionAthletes, color: 'hsl(var(--accent))',           icon: ArrowRight },
    { name: 'Mayores',    value: seniorsAthletes,    color: 'hsl(var(--muted-foreground))', icon: Crown },
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
          { name: 'Escuela',    value: Math.round(schoolAthletes     * eased), color: 'hsl(var(--primary))',         icon: GraduationCap },
          { name: 'Menores',    value: Math.round(minorsAthletes     * eased), color: 'hsl(var(--secondary))',        icon: Baby },
          { name: 'Transición', value: Math.round(transitionAthletes * eased), color: 'hsl(var(--accent))',           icon: ArrowRight },
          { name: 'Mayores',    value: Math.round(seniorsAthletes    * eased), color: 'hsl(var(--muted-foreground))', icon: Crown },
        ]);
        currentStep++;
        setTimeout(animate, stepDuration);
      } else {
        setAnimationComplete(true);
      }
    };

    animate();
  }, [schoolAthletes, minorsAthletes, transitionAthletes, seniorsAthletes]);

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
        <CardTitle className="text-lg font-semibold text-gray-800">Distribución por Categoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        {total === 0 ? (
          <p className="text-sm text-gray-500">Sin datos de categoría disponibles.</p>
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

export default CategoryDistributionChart;
