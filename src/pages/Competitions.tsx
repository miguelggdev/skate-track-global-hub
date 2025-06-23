
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Trophy,
  Calendar,
  MapPin,
  Users,
  Medal,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';

const Competitions = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { 
      title: "ACTIVE COMPETITIONS", 
      value: "12", 
      change: "+2", 
      period: "from last month",
      icon: Trophy,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "PARTICIPANTS", 
      value: "348", 
      change: "+15%", 
      period: "since last event",
      icon: Users,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    { 
      title: "MEDALS WON", 
      value: "87", 
      change: "+23", 
      period: "this season",
      icon: Medal,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    { 
      title: "UPCOMING EVENTS", 
      value: "8", 
      change: "+3", 
      period: "next 30 days",
      icon: Calendar,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
  ];

  const competitions = [
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

  const upcomingEvents = [
    { name: "Winter Speed Championship", date: "Feb 15", time: "09:00 AM", priority: "high" },
    { name: "Regional Speed Trials", date: "Jan 28", time: "10:30 AM", priority: "medium" },
    { name: "Training Camp Selection", date: "Feb 01", time: "02:00 PM", priority: "high" },
    { name: "Equipment Check", date: "Jan 25", time: "08:00 AM", priority: "low" },
  ];

  const medalDistribution = [
    { type: "Gold", count: 28, color: "bg-yellow-500" },
    { type: "Silver", count: 31, color: "bg-gray-400" },
    { type: "Bronze", count: 28, color: "bg-orange-600" },
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
    <DashboardLayout title="Competitions">
      <div className="space-y-6 max-w-none">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Competitions</h1>
              <p className="text-gray-600">Manage competitions, events and track results</p>
            </div>
            <Button className="argon-gradient-blue text-white hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              New Competition
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="argon-card relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div>
                  <CardDescription className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {stat.title}
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </CardTitle>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} text-white shadow-lg`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-sm text-gray-600">
                  <span className={`font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>{' '}
                  {stat.period}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Competitions Overview */}
          <Card className="lg:col-span-2 argon-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800">Competition Results</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Performance across all competitions</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-600">Competition performance chart</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medal Distribution */}
          <Card className="argon-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Medal Distribution</CardTitle>
              <CardDescription className="text-sm text-gray-600">This season's achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {medalDistribution.map((medal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg ${medal.color} flex items-center justify-center`}>
                        <Medal className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-800">{medal.type}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-800">{medal.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${medal.color}`}
                      style={{ width: `${(medal.count / 87) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Competition Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Competitions Table */}
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

          {/* Upcoming Events */}
          <Card className="argon-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      event.priority === 'high' ? 'bg-red-500' :
                      event.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-800">{event.name}</p>
                      <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Competitions;
