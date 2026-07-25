
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import AddAthleteDialog from './AddAthleteDialog';
import AthleteReportGenerator from './AthleteReportGenerator';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AthletesHeaderProps {
  onAthleteAdded: () => void;
}

const AthletesHeader = ({ onAthleteAdded }: AthletesHeaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isAdmin, isCoach } = useUserProfile();

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 truncate">Manage and monitor athlete performance</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          {(isAdmin || isCoach) && (
            <>
              <AthleteReportGenerator />
              <Button 
                className="argon-gradient-blue text-white hover:opacity-90 text-sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Athlete
              </Button>
            </>
          )}
        </div>
      </div>

      {(isAdmin || isCoach) && (
        <AddAthleteDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onAthleteAdded={onAthleteAdded}
        />
      )}
    </div>
  );
};

export default AthletesHeader;
