import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MapPin, Search, Filter, Edit, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { useCompetitions, useCompetitionRegistrations, useDeleteCompetition } from '@/hooks/useCompetitions';
import { format } from 'date-fns';
import { EditCompetitionDialog } from './EditCompetitionDialog';
import { CompetitionPDFReport } from './CompetitionPDFReport';
import { MedalRecordingDialog } from './MedalRecordingDialog';


const CompetitionsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingCompetition, setDeletingCompetition] = useState<string | null>(null);
  const { data: competitions = [], isLoading, error } = useCompetitions();
  const { data: registrationCounts = {} } = useCompetitionRegistrations();
  const deleteCompetition = useDeleteCompetition();

  const handleDeleteCompetition = async (competitionId: string) => {
    try {
      await deleteCompetition.mutateAsync(competitionId);
      setDeletingCompetition(null);
    } catch (error) {
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const filteredCompetitions = competitions.filter(competition =>
    competition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competition.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (competition.category && competition.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (error) {
    return (
      <Card className="argon-card">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading competitions. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="argon-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Competition Management</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search competitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No competitions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Competition</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Participants</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetitions.map((competition) => (
                  <tr key={competition.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-800">{competition.name}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {competition.location}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {format(new Date(competition.start_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      {competition.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {competition.category}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {registrationCounts[competition.id] || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                        {getStatusLabel(competition.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <EditCompetitionDialog competition={competition} />
                        <CompetitionPDFReport 
                          competitionId={competition.id} 
                          competitionName={competition.name}
                        />
                        <MedalRecordingDialog
                          competitionId={competition.id}
                          competitionName={competition.name}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeletingCompetition(competition.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Competition
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCompetition} onOpenChange={() => setDeletingCompetition(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this competition? This action cannot be undone.
              All associated registrations will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCompetition && handleDeleteCompetition(deletingCompetition)}
              disabled={deleteCompetition.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCompetition.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CompetitionsTable;