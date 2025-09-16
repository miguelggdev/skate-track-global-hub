import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, Baby, ArrowRight, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryDistributionProps {
  escuelaAthletes: number;
  menoresAthletes: number;
  transicionAthletes: number;
  mayoresAthletes: number;
  juvenilAthletes: number;
  totalAthletes: number;
}

const CategoryDistributionChart: React.FC<CategoryDistributionProps> = ({
  escuelaAthletes,
  menoresAthletes,
  transicionAthletes,
  mayoresAthletes,
  juvenilAthletes,
  totalAthletes
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Group categories into the requested display categories
  const schoolAthletes = categoryCounts['escuela'] || escuelaAthletes || 0;
  const minorsAthletes = categoryCounts['menores'] || menoresAthletes || 0;
  const transitionAthletes = categoryCounts['transicion'] || transicionAthletes || 0;
  const seniorsAthletes = (categoryCounts['mayores'] || mayoresAthletes || 0) + 
                         (categoryCounts['juvenil'] || juvenilAthletes || 0) +
                         (categoryCounts['senior'] || 0) +
                         (categoryCounts['masters'] || 0);

  const total = schoolAthletes + minorsAthletes + transitionAthletes + seniorsAthletes;

  const [displayedData, setDisplayedData] = useState([
    { name: 'School Athletes', value: 0, color: 'hsl(var(--primary))', icon: GraduationCap },
    { name: 'Minors', value: 0, color: 'hsl(var(--secondary))', icon: Baby },
    { name: 'Transition', value: 0, color: 'hsl(var(--accent))', icon: ArrowRight },
    { name: 'Seniors', value: 0, color: 'hsl(var(--muted-foreground))', icon: Crown }
  ]);

  const finalData = [
    { name: 'School Athletes', value: schoolAthletes, color: 'hsl(var(--primary))', icon: GraduationCap },
    { name: 'Minors', value: minorsAthletes, color: 'hsl(var(--secondary))', icon: Baby },
    { name: 'Transition', value: transitionAthletes, color: 'hsl(var(--accent))', icon: ArrowRight },
    { name: 'Seniors', value: seniorsAthletes, color: 'hsl(var(--muted-foreground))', icon: Crown }
  ];

  // Animate the chart data on mount and when values change
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const animate = () => {
      if (currentStep <= steps) {
        const progress = currentStep / steps;
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        
        setDisplayedData([
          {
            name: 'School Athletes',
            value: Math.round(schoolAthletes * easeOutProgress),
            color: 'hsl(var(--primary))',
            icon: GraduationCap
          },
          {
            name: 'Minors',
            value: Math.round(minorsAthletes * easeOutProgress),
            color: 'hsl(var(--secondary))',
            icon: Baby
          },
          {
            name: 'Transition',
            value: Math.round(transitionAthletes * easeOutProgress),
            color: 'hsl(var(--accent))',
            icon: ArrowRight
          },
          {
            name: 'Seniors',
            value: Math.round(seniorsAthletes * easeOutProgress),
            color: 'hsl(var(--muted-foreground))',
            icon: Crown
          }
        ]);

        currentStep++;
        setTimeout(animate, stepDuration);
      } else {
        setAnimationComplete(true);
      }
    };

    animate();
  }, [schoolAthletes, minorsAthletes, transitionAthletes, seniorsAthletes]);

  // Fetch category counts from the database and subscribe to realtime changes
  useEffect(() => {
    let subscribed = true;

    const fetchCategoryCounts = async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('category')
        .eq('status', 'active');

      if (error || !subscribed) return;

      const counts = data.reduce((acc, athlete) => {
        acc[athlete.category] = (acc[athlete.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setCategoryCounts(counts);
    };

    fetchCategoryCounts();

    const channel = supabase
      .channel('athletes-category-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athletes' },
        () => {
          fetchCategoryCounts();
        }
      )
      .subscribe();

    return () => {
      subscribed = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total ? Math.round((data.value / total) * 100) : 0;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-white">
            {data.payload.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {data.value} athletes ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold text-sm drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="xl:col-span-1 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Category Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        {total === 0 ? (
          <p className="text-sm text-gray-500">No category data available.</p>
        ) : (
          <>
            {/* Small Chart */}
            <div className="h-20 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayedData}
                    cx="50%"
                    cy="50%"
                    outerRadius={35}
                    fill="#8884d8"
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

            {/* List-style Legend */}
            {finalData.map((item, index) => {
              const percentage = total ? Math.round((item.value / total) * 100) : 0;
              const displayValue = displayedData[index]?.value || 0;
              
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm truncate flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {displayValue} athletes
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{percentage}%</span>
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