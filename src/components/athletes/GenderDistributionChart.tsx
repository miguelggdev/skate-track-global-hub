import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User, UserCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
interface GenderDistributionProps {
  maleAthletes: number;
  femaleAthletes: number;
  totalAthletes: number;
}

const GenderDistributionChart: React.FC<GenderDistributionProps> = ({
  maleAthletes,
  femaleAthletes,
  totalAthletes
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [maleCount, setMaleCount] = useState<number | null>(null);
  const [femaleCount, setFemaleCount] = useState<number | null>(null);

  const male = (maleCount ?? maleAthletes) || 0;
  const female = (femaleCount ?? femaleAthletes) || 0;
  const total = male + female;

  const [displayedData, setDisplayedData] = useState([
    { name: 'Male', value: 0, color: 'hsl(var(--primary))', icon: User },
    { name: 'Female', value: 0, color: 'hsl(var(--accent))', icon: UserCircle2 }
  ]);

  const finalData = [
    { name: 'Male', value: male, color: 'hsl(var(--primary))', icon: User },
    { name: 'Female', value: female, color: 'hsl(var(--accent))', icon: UserCircle2 }
  ];

  // Animate the chart data on mount and when values change
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const animate = () => {
      if (currentStep <= steps) {
        const progress = currentStep / steps;
        const easeOutProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        setDisplayedData([
          {
            name: 'Male',
            value: Math.round(male * easeOutProgress),
            color: 'hsl(var(--primary))',
            icon: User
          },
          {
            name: 'Female',
            value: Math.round(female * easeOutProgress),
            color: 'hsl(var(--accent))',
            icon: UserCircle2
          }
        ]);

        currentStep++;
        setTimeout(animate, stepDuration);
      } else {
        setAnimationComplete(true);
      }
    };

    animate();
  }, [male, female]);

  // Fetch counts from the database and subscribe to realtime changes
  useEffect(() => {
    let subscribed = true;

    const fetchCounts = async () => {
      const { count: maleC } = await supabase
        .from('athletes')
        .select('id', { count: 'exact', head: true })
        .eq('gender', 'masculino');

      const { count: femaleC } = await supabase
        .from('athletes')
        .select('id', { count: 'exact', head: true })
        .eq('gender', 'femenino');

      if (!subscribed) return;
      setMaleCount(maleC ?? 0);
      setFemaleCount(femaleC ?? 0);
    };

    fetchCounts();

    const channel = supabase
      .channel('athletes-gender-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athletes' },
        () => {
          fetchCounts();
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
            {data.payload.name} Athletes
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
    if (percent < 0.05) return null; // Don't show label if slice is too small
    
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
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg font-bold text-gray-800 dark:text-white mb-1">
            GENDER DISTRIBUTION
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
          <p className="text-sm text-muted-foreground mb-4">No gender data available.</p>
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
                  animationDuration={0} // We handle animation manually
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
              const percentage = totalAthletes ? Math.round((item.value / totalAthletes) * 100) : 0;
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

export default GenderDistributionChart;