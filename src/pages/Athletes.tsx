
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Medal,
  Calendar,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const Athletes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { 
      title: "TOTAL ATHLETES", 
      value: "156", 
      change: "+12%", 
      period: "since last month",
      icon: Users,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "ACTIVE TODAY", 
      value: "89", 
      change: "+5%", 
      period: "since yesterday",
      icon: TrendingUp,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    { 
      title: "COMPETITIONS", 
      value: "24", 
      change: "+8", 
      period: "this season",
      icon: Medal,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    { 
      title: "AVG PERFORMANCE", 
      value: "87.5%", 
      change: "+2.1%", 
      period: "improvement rate",
      icon: Star,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
  ];

  const athletes = [
    {
      id: 1,
      name: "Juan Pérez",
      email: "juan.perez@email.com",
      category: "Junior",
      level: "Advanced",
      joinDate: "2024-01-15",
      status: "Active",
      performance: 92,
      avatar: "🥇"
    },
    {
      id: 2,
      name: "María García",
      email: "maria.garcia@email.com",
      category: "Senior",
      level: "Professional",
      joinDate: "2023-08-20",
      status: "Active",
      performance: 95,
      avatar: "🏆"
    },
    {
      id: 3,
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@email.com",
      category: "Youth",
      level: "Intermediate",
      joinDate: "2024-03-10",
      status: "Training",
      performance: 78,
      avatar: "🥈"
    },
    {
      id: 4,
      name: "Ana López",
      email: "ana.lopez@email.com",
      category: "Junior",
      level: "Advanced",
      joinDate: "2024-02-05",
      status: "Active",
      performance: 88,
      avatar: "🥉"
    },
    {
      id: 5,
      name: "Diego Martín",
      email: "diego.martin@email.com",
      category: "Senior",
      level: "Professional",
      joinDate: "2023-11-12",
      status: "Injured",
      performance: 85,
      avatar: "🏅"
    }
  ];

  const recentActivity = [
    { athlete: "Juan Pérez", action: "Training completed", time: "2h ago", type: "training" },
    { athlete: "María García", action: "New personal record", time: "4h ago", type: "achievement" },
    { athlete: "Carlos Rodríguez", action: "Competition registered", time: "1d ago", type: "competition" },
    { athlete: "Ana López", action: "Profile updated", time: "2d ago", type: "update" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Training': return 'bg-blue-100 text-blue-800';
      case 'Injured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-blue-600';
    if (performance >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 argon-sidebar z-50">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 argon-gradient-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-800">SpeedSkate Academy</span>
          </div>
          
          <nav className="space-y-2">
            <div className="argon-sidebar-item" onClick={() => navigate('/')}>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <span>Dashboard</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item active">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <span className="font-medium">Athletes</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5" />
                <span>Training</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item">
              <div className="flex items-center space-x-3">
                <Medal className="h-5 w-5" />
                <span>Competitions</span>
              </div>
            </div>
          </nav>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full justify-start argon-gradient-blue text-white hover:opacity-90"
              variant="ghost"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Athletes Management</h1>
              <p className="text-gray-600">Manage and monitor athlete performance</p>
            </div>
            <Button className="argon-gradient-blue text-white hover:opacity-90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Athlete
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

        {/* Search and Filter Bar */}
        <Card className="argon-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search athletes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Athletes Table */}
          <Card className="lg:col-span-2 argon-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Athletes List</CardTitle>
              <CardDescription>Manage your athletes and their information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAthletes.map((athlete) => (
                    <TableRow key={athlete.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-lg">{athlete.avatar}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{athlete.name}</p>
                            <p className="text-sm text-gray-600">{athlete.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{athlete.category}</TableCell>
                      <TableCell>{athlete.level}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(athlete.status)}`}>
                          {athlete.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getPerformanceColor(athlete.performance)}`}>
                          {athlete.performance}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="argon-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'training' ? 'bg-blue-500' :
                      activity.type === 'achievement' ? 'bg-green-500' :
                      activity.type === 'competition' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-800">{activity.athlete}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Athletes;
