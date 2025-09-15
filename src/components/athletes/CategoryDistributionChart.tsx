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
    <Card className="argon-card relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer hover:shadow-xl col-span-1 sm:col-span-2">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg font-bold text-gray-800 dark:text-white mb-1">
            CATEGORY DISTRIBUTION
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Total athletes: <span className="font-semibold">{total}</span>
          </p>
        </div>
        <div className="p-3 rounded-xl argon-gradient-purple text-white shadow-lg flex-shrink-0 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
          <Users className="h-7 w-7" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 relative z-10">
        {total === 0 && (
          <p className="text-sm text-muted-foreground mb-4">No category data available.</p>
        )}
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="flex-1 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={0}
                  className={`transition-all duration-300 ${animationComplete ? 'animate-scale-in' : ''}`}
                >
                  {displayedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {finalData.map((item, index) => {
              const percentage = total ? Math.round((item.value / total) * 100) : 0;
              const displayValue = displayedData[index]?.value || 0;
              
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0 animate-fade-in"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-gray-800 dark:text-white">
                        {displayValue}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryDistributionChart;