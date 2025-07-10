import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trophy } from 'lucide-react';

interface LeagueCountryInfoProps {
  control: Control<any>;
}

const LeagueCountryInfo = ({ control }: LeagueCountryInfoProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Trophy className="h-5 w-5" />
        Liga y País
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="league"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Liga a la que pertenece</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la liga" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Input placeholder="España" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default LeagueCountryInfo;