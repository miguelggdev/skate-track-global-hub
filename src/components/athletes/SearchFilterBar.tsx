
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchFilterBar = ({ searchTerm, setSearchTerm }: SearchFilterBarProps) => {
  return (
    <Card className="argon-card mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Button variant="toggle-secondary" className="flex items-center space-x-2 text-sm rounded-full px-4">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilterBar;
