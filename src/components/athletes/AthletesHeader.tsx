
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

const AthletesHeader = () => {
  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 truncate">Manage and monitor athlete performance</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Button className="argon-gradient-blue text-white hover:opacity-90 text-sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Athlete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AthletesHeader;
