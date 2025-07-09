import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Filter, Edit, MoreHorizontal } from 'lucide-react';

interface Competition {
  id: number;
  name: string;
  date: string;
  location: string;
  category: string;
  participants: number;
  status: string;
  type: string;
}

const CompetitionsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const competitions: Competition[] = [
    {
      id: 1,
      name: "Winter Speed Championship",
      date: "2024-02-15",
      location: "Olympic Ice Rink",
      category: "Senior",
      participants: 45,
      status: "Upcoming",
      type: "Championship"
    },
    {
      id: 2,
      name: "Regional Speed Trials",
      date: "2024-01-28",
      location: "City Ice Arena",
      category: "Junior",
      participants: 32,
      status: "Registration Open",
      type: "Regional"
    },
    {
      id: 3,
      name: "International Speed Cup",
      date: "2024-03-10",
      location: "National Stadium",
      category: "Elite",
      participants: 78,
      status: "Upcoming",
      type: "International"
    },
    {
      id: 4,
      name: "Youth Development Meet",
      date: "2024-01-20",
      location: "Training Center",
      category: "Youth",
      participants: 28,
      status: "Completed",
      type: "Development"
    },
    {
      id: 5,
      name: "Spring Sprint Series",
      date: "2024-04-05",
      location: "Sports Complex",
      category: "Open",
      participants: 56,
      status: "Registration Open",
      type: "Series"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'Registration Open': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCompetitions = competitions.filter(competition =>
    competition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competition.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competition.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="lg:col-span-2 argon-card">
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
                  <td className="py-3 px-4 text-gray-600">{competition.date}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {competition.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{competition.participants}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                      {competition.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitionsTable;