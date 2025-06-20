
import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

const Training = () => {
  const navigate = useNavigate();
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
                <Activity className="h-5 w-5" />
                <span>Dashboard</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item" onClick={() => navigate('/athletes')}>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <span>Athletes</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item active">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Training</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item">
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5" />
                <span>Competitions</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5" />
                <span>Performance</span>
              </div>
            </div>
          </nav>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">ACCESS</p>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full justify-start argon-gradient-blue text-white hover:opacity-90"
              variant="ghost"
            >
              Login to System
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
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Training Management</h1>
              <p className="text-gray-600">Manage training sessions and programs</p>
            </div>
            <div className="flex space-x-3">
              <Button className="argon-gradient-blue text-white hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
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
          {/* Training Sessions */}
          <Card className="lg:col-span-2 argon-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800">Training Sessions</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Today's schedule and upcoming sessions</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                  <div key={session.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${session.type === 'speed' ? 'argon-gradient-blue' : 
                                      session.type === 'technique' ? 'argon-gradient-purple' :
                                      session.type === 'endurance' ? 'argon-gradient-green' : 'argon-gradient-orange'} text-white`}>
                          {getTypeIcon(session.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{session.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {session.time} - {session.duration}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {session.athletes} athletes
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {session.location}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Coach: {session.coach}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                        <div className="flex space-x-1">
                          {session.status === 'scheduled' && (
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {session.status === 'in-progress' && (
                            <Button size="sm" variant="outline">
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
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
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Training Control</h3>
                <p className="text-purple-100">Quick actions for training management</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
                <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
                <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600">
                  <Activity className="h-4 w-4 mr-2" />
                  Performance Reports
                </Button>
                <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600">
                  <Trophy className="h-4 w-4 mr-2" />
                  Competition Prep
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training Programs Progress */}
          <Card className="argon-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Training Programs</CardTitle>
              <CardDescription className="text-sm text-gray-600">Current program progress and participation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {trainingPrograms.map((program, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg ${program.color} flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">
                          {program.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{program.name}</span>
                        <p className="text-sm text-gray-500">{program.athletes} athletes enrolled</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">{program.progress}%</span>
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
              <CardTitle className="text-lg font-semibold text-gray-800">Weekly Overview</CardTitle>
              <CardDescription className="text-sm text-gray-600">Training statistics for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Performance Analytics</p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">24</p>
                      <p className="text-sm text-gray-500">Sessions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">92%</p>
                      <p className="text-sm text-gray-500">Attendance</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Training;
