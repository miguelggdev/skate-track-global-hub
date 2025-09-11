import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryDisplayName } from '@/utils/ageCalculations';
import { format, isWithinInterval, addDays, startOfDay } from 'date-fns';

interface AthleteWithBirthday {
  id: string;
  first_name?: string;
  last_name?: string;
  category: string;
  date_of_birth?: string;
}

const UpcomingBirthdays = () => {
  const { data: athletes, isLoading } = useQuery({
    queryKey: ['athletes-birthdays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select(`
          id,
          first_name,
          last_name,
          category,
          user_id,
          profiles!user_id(date_of_birth)
        `)
        .eq('status', 'active')
        .not('profiles.date_of_birth', 'is', null);

      if (error) throw error;

      return (data || []).map(athlete => ({
        ...athlete,
        date_of_birth: (athlete.profiles as any)?.date_of_birth
      })) as AthleteWithBirthday[];
    },
  });

  const getUpcomingBirthdays = () => {
    if (!athletes) return [];

    const today = startOfDay(new Date());
    const thirtyDaysFromNow = addDays(today, 30);

    return athletes
      .filter(athlete => athlete.date_of_birth)
      .map(athlete => {
        const birthDate = new Date(athlete.date_of_birth);
        const currentYear = today.getFullYear();
        
        // Create this year's birthday
        const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        
        // If this year's birthday has passed, use next year's
        const upcomingBirthday = thisYearBirthday < today 
          ? new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate())
          : thisYearBirthday;

        return {
          ...athlete,
          upcomingBirthday,
          isUpcoming: isWithinInterval(upcomingBirthday, { start: today, end: thirtyDaysFromNow })
        };
      })
      .filter(athlete => athlete.isUpcoming)
      .sort((a, b) => a.upcomingBirthday.getTime() - b.upcomingBirthday.getTime())
      .slice(0, 6); // Show max 6 upcoming birthdays
  };

  const upcomingBirthdays = getUpcomingBirthdays();

  const getDaysUntilBirthday = (birthday: Date) => {
    const today = startOfDay(new Date());
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  if (isLoading) {
    return (
      <Card className="xl:col-span-1 argon-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Birthdays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="xl:col-span-1 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Birthdays</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        {upcomingBirthdays.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No upcoming birthdays in the next 30 days</p>
          </div>
        ) : (
          upcomingBirthdays.map((athlete, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0 bg-pink-500"></div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {athlete.first_name} {athlete.last_name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {getCategoryDisplayName(athlete.category)} • {format(new Date(athlete.date_of_birth!), 'MMM d')}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {getDaysUntilBirthday(athlete.upcomingBirthday)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingBirthdays;