
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Athlete {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category: string;
  level: string;
  join_date: string;
  status: string;
  performance_score?: number;
}

interface AthletesTableProps {
  athletes: Athlete[];
  loading?: boolean;
}

const AthletesTable = ({ athletes, loading = false }: AthletesTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'injured': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-blue-600';
    if (performance >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="xl:col-span-2 argon-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Athletes List</CardTitle>
        <CardDescription>Manage your athletes and their information</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px] px-6">Athlete</TableHead>
                <TableHead className="min-w-[100px] px-4">Category</TableHead>
                <TableHead className="min-w-[120px] px-4">Level</TableHead>
                <TableHead className="min-w-[100px] px-4">Status</TableHead>
                <TableHead className="min-w-[120px] px-4">Performance</TableHead>
                <TableHead className="min-w-[80px] text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="ml-2">Loading athletes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : athletes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No athletes found. Add your first athlete to get started.
                  </TableCell>
                </TableRow>
              ) : (
                athletes.map((athlete) => {
                  const fullName = athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : 'Unknown';
                  const email = athlete.email || 'No email';
                  const performanceScore = athlete.performance_score || 0;
                  
                  return (
                    <TableRow key={athlete.id}>
                      <TableCell className="px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">👤</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 truncate">{fullName}</p>
                            <p className="text-sm text-gray-600 truncate">{email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-sm capitalize">{athlete.category}</TableCell>
                      <TableCell className="px-4 text-sm capitalize">{athlete.level}</TableCell>
                      <TableCell className="px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize ${getStatusColor(athlete.status)}`}>
                          {athlete.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className={`font-semibold text-sm ${getPerformanceColor(performanceScore)}`}>
                          {performanceScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AthletesTable;
