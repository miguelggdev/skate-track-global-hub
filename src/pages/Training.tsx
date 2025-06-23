import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  Clock,
  Users,
  Trophy,
  Target,
  Activity,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  Timer
} from 'lucide-react';

const Training = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { 
      title: "ACTIVE SESSIONS", 
      value: "12", 
      change: "+8%", 
      period: "from last week",
      icon: Activity,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "TOTAL ATHLETES", 
      value: "156", 
      change: "+12%", 
      period: "from last month",
      icon: Users,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    { 
      title: "COMPLETION RATE", 
      value: "94.2%", 
      change: "+2.1%", 
      period: "from last week",
      icon: Target,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    { 
      title: "AVG SESSION TIME", 
      value: "2.5h", 
      change: "-5%", 
      period: "from last week",
      icon: Timer,
      bgColor: "argon-gradient-red",
      isPositive: false
    },
  ];

  const upcomingSessions = [
    {
      id: 1,
      title: "Speed Training - Group A",
      time: "08:00 AM",
      date: "2024-06-21",
      duration: "2 hours",
      athletes: 12,
      coach: "Maria Rodriguez",
      location: "Main Rink",
      status: "scheduled",
      type: "speed"
    },
    {
      id: 2,
      title: "Technique Workshop",
      time: "10:30 AM",
      date: "2024-06-21",
      duration: "1.5 hours",
      athletes: 8,
      coach: "Carlos Mendez",
      location: "Training Hall",
      status: "in-progress",
      type: "technique"
    },
    {
      id: 3,
      title: "Endurance Training",
      time: "02:00 PM",
      date: "2024-06-21",
      duration: "3 hours",
      athletes: 15,
      coach: "Ana Silva",
      location: "Main Rink",
      status: "scheduled",
      type: "endurance"
    },
    {
      id: 4,
      title: "Competition Prep",
      time: "04:30 PM",
      date: "2024-06-21",
      duration: "2.5 hours",
      athletes: 6,
      coach: "Luis Garcia",
      location: "Competition Track",
      status: "completed",
      type: "competition"
    }
  ];

  const trainingPrograms = [
    { name: "Sprint Development", progress: 75, color: "bg-blue-500", athletes: 24 },
    { name: "Endurance Building", progress: 60, color: "bg-green-500", athletes: 18 },
    { name: "Technique Mastery", progress: 90, color: "bg-purple-500", athletes: 12 },
    { name: "Competition Ready", progress: 45, color: "bg-orange-500", athletes: 8 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'speed': return <Target className="h-4 w-4" />;
      case 'technique': return <Trophy className="h-4 w-4" />;
      case 'endurance': return <Activity className="h-4 w-4" />;
      case 'competition': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredSessions = upcomingSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.coach.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <DashboardLayout title="Training Management">
        <div className="w-full max-w-full">
          {/* Header Actions */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Manage training sessions and programs</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="argon-gradient-blue text-white hover:opacity-90 text-sm lg:text-base">
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
                <Button variant="outline" className="text-sm lg:text-base">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="argon-card relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <div className="min-w-0 flex-1">
                    <CardDescription className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      {stat.title}
                    </CardDescription>
                    <CardTitle className="text-lg lg:text-2xl font-bold text-gray-800 truncate">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={`p-2 lg:p-3 rounded-lg ${stat.bgColor} text-white shadow-lg flex-shrink-0`}>
                    <stat.icon className="h-4 w-4 lg:h-6 lg:w-6" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-xs lg:text-sm text-gray-600">
                    <span className={`font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>{' '}
                    {stat.period}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Training Sessions */}
            <Card className="xl:col-span-2 argon-card">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">Training Sessions</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Today's schedule and upcoming sessions</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search sessions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-48 lg:w-64 text-sm"
                      />
                    </div>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
                    >
                      <option value="all">All Status</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-3 lg:p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start lg:items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
                          <div className={`p-2 rounded-lg ${session.type === 'speed' ? 'argon-gradient-blue' : 
                                        session.type === 'technique' ? 'argon-gradient-purple' :
                                        session.type === 'endurance' ? 'argon-gradient-green' : 'argon-gradient-orange'} text-white flex-shrink-0`}>
                            {getTypeIcon(session.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm lg:text-base truncate">{session.title}</h4>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs lg:text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                {session.time} - {session.duration}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                {session.athletes} athletes
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                {session.location}
                              </span>
                            </div>
                            <p className="text-xs lg:text-sm text-gray-500 mt-1">Coach: {session.coach}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                          <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>
                          <div className="flex gap-1">
                            {session.status === 'scheduled' && (
                              <Button size="sm" variant="outline">
                                <Play className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            )}
                            {session.status === 'in-progress' && (
                              <Button size="sm" variant="outline">
                                <Pause className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="argon-card argon-gradient-purple text-white">
              <CardContent className="p-4 lg:p-6">
                <div className="text-center">
                  <h3 className="text-lg lg:text-xl font-bold mb-2">Training Control</h3>
                  <p className="text-purple-100 mb-4 lg:mb-6 text-sm lg:text-base">Quick actions for training management</p>
                  <div className="space-y-3">
                    <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 text-sm lg:text-base">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-sm lg:text-base">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Calendar
                    </Button>
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-sm lg:text-base">
                      <Activity className="h-4 w-4 mr-2" />
                      Performance Reports
                    </Button>
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-sm lg:text-base">
                      <Trophy className="h-4 w-4 mr-2" />
                      Competition Prep
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Training Programs Progress */}
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">Training Programs</CardTitle>
                <CardDescription className="text-sm text-gray-600">Current program progress and participation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                {trainingPrograms.map((program, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg ${program.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-bold">
                            {program.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-800 text-sm lg:text-base block truncate">{program.name}</span>
                          <p className="text-xs lg:text-sm text-gray-500">{program.athletes} athletes enrolled</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 flex-shrink-0">{program.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${program.color}`}
                        style={{ width: `${program.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Overview */}
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">Weekly Overview</CardTitle>
                <CardDescription className="text-sm text-gray-600">Training statistics for this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 lg:h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 lg:h-16 lg:w-16 text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4 text-sm lg:text-base">Performance Analytics</p>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xl lg:text-2xl font-bold text-blue-600">24</p>
                        <p className="text-xs lg:text-sm text-gray-500">Sessions</p>
                      </div>
                      <div>
                        <p className="text-xl lg:text-2xl font-bold text-green-600">92%</p>
                        <p className="text-xs lg:text-sm text-gray-500">Attendance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default Training;
