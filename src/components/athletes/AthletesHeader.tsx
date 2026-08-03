
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, FileSpreadsheet } from 'lucide-react';
import AddAthleteDialog from './AddAthleteDialog';
import AthleteReportGenerator from './AthleteReportGenerator';
import { BulkImportDialog } from './BulkImportDialog';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AthletesHeaderProps {
  onAthleteAdded: () => void;
}

const AthletesHeader = ({ onAthleteAdded }: AthletesHeaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { isAdmin, isCoach } = useUserProfile();

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 truncate">Gestiona y monitorea el rendimiento de los atletas</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          {(isAdmin || isCoach) && (
            <>
              <AthleteReportGenerator />
              <Button
                variant="outline"
                className="text-sm gap-2"
                onClick={() => setImportOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                Importar Excel
              </Button>
              <Button
                className="argon-gradient-blue text-white hover:opacity-90 text-sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Atleta
              </Button>
            </>
          )}
        </div>
      </div>

      {(isAdmin || isCoach) && (
        <>
          <AddAthleteDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onAthleteAdded={onAthleteAdded}
          />
          <BulkImportDialog
            open={importOpen}
            onClose={() => setImportOpen(false)}
            onImported={onAthleteAdded}
          />
        </>
      )}
    </div>
  );
};

export default AthletesHeader;
