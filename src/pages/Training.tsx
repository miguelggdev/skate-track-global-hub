import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useTrainingStats } from '@/hooks/useTrainingStats';
import CreateTrainingDialog from '@/components/training/CreateTrainingDialog';
import EditTrainingDialog from '@/components/training/EditTrainingDialog';
import QuickAttendanceDialog from '@/components/training/QuickAttendanceDialog';
import QuickAttendanceRegistration from '@/components/training/QuickAttendanceRegistration';
import DailyAttendanceIndicator from '@/components/training/DailyAttendanceIndicator';
import CalendarViewDialog from '@/components/training/CalendarViewDialog';
import { TrainingStatsCharts } from '@/components/training/TrainingStatsCharts';
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
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [currentView, setCurrentView] = useState<'sessions' | 'attendance'>('sessions');
  const { isAdmin } = useUserProfile();
  
  // Fetch training sessions and stats from database
  const { trainingSessions, isLoading } = useTrainingSessions({
    includeCoachInfo: true,
    dateFilter: 'all'
  });
  
  const { data: trainingStats, isLoading: isStatsLoading } = useTrainingStats();

  const stats = [
    { 
      title: "ACTIVE SESSIONS", 
      value: trainingStats?.activeSessions?.toString() || "0", 
      change: "+8%", 
      period: "from last week",
      icon: Activity,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "TOTAL ATHLETES", 
      value: trainingStats?.totalAthletes?.toString() || "0", 
      change: `${trainingStats?.activeAthletes || 0} active`, 
      period: "in last 30 days",
      icon: Users,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    { 
      title: "COMPLETION RATE", 
      value: `${trainingStats?.completionRate?.toFixed(1) || "0"}%`, 
      change: "+2.1%", 
      period: "from last month",
      icon: Target,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    { 
      title: "AVG SESSION TIME", 
      value: `${trainingStats?.avgSessionTime?.toFixed(1) || "0"}h`, 
      change: "stable", 
      period: "average duration",
      icon: Timer,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
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
      case 'physical': return <Target className="h-4 w-4" />;
      case 'technical': return <Trophy className="h-4 w-4" />;
      case 'mental': return <Activity className="h-4 w-4" />;
      case 'track_skating': return <CheckCircle className="h-4 w-4" />;
      case 'road_skating': return <Activity className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'physical': return 'argon-gradient-blue';
      case 'technical': return 'argon-gradient-purple';
      case 'mental': return 'argon-gradient-green';
      case 'track_skating': return 'argon-gradient-orange';
      case 'road_skating': return 'argon-gradient-red';
      default: return 'argon-gradient-blue';
    }
  };

  const filteredSessions = trainingSessions
    .filter(session => {
      const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.coach.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by date (newest first), then by time
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // Newest first
      }
      
      // If same date, sort by start time (earliest first for same day)
      const timeA = a.start_time;
      const timeB = b.start_time;
      return timeA.localeCompare(timeB);
    });

  return (
    <DashboardLayout title="Training Management">
      <div className="space-y-6 w-full">
        {/* Header Actions */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0">
            <p className="text-sm text-gray-600 truncate">Manage training sessions and programs</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            {(isAdmin) && (
              <CreateTrainingDialog>
                <Button className="argon-gradient-blue text-white hover:opacity-90 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </CreateTrainingDialog>
            )}
            <Button 
              onClick={() => setCurrentView(currentView === 'sessions' ? 'attendance' : 'sessions')}
              className="argon-gradient-green text-white hover:opacity-90 text-sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {currentView === 'sessions' ? 'Register Attendance' : 'View Sessions'}
            </Button>
            <QuickAttendanceDialog>
              <Button variant="outline" className="text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create & Register
              </Button>
            </QuickAttendanceDialog>
            <Button variant="outline" className="text-sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <DailyAttendanceIndicator />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="argon-card relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="min-w-0 flex-1 pr-2">
                  <CardDescription className="text-xs font-medium text-gray-600 uppercase tracking-wider truncate">
                    {stat.title}
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-gray-800 truncate">
                    {isStatsLoading ? "..." : stat.value}
                  </CardTitle>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor} text-white shadow-lg flex-shrink-0`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 truncate">
                  <span className={`font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>{' '}
                  {stat.period}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Training Analytics Charts */}
        {trainingStats && (
          <div className="mt-6">
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Training Analytics</CardTitle>
                <CardDescription className="text-sm text-gray-600">Performance insights and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <TrainingStatsCharts stats={trainingStats} isLoading={isStatsLoading} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'attendance' ? (
          <QuickAttendanceRegistration />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
          {/* Training Sessions */}
          <div className="xl:col-span-2">
            <Card className="argon-card h-full">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-800 truncate">Training Sessions</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Today's schedule and upcoming sessions</CardDescription>
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 lg:flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-40 lg:w-48 text-sm"
                      />
                    </div>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white min-w-0"
                    >
                      <option value="all">All Status</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
               <CardContent className="px-6">
                 {isLoading ? (
                   <div className="flex justify-center items-center h-32">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                   </div>
                 ) : (
                   <div className="space-y-4 max-h-96 overflow-y-auto">
                     {filteredSessions.length === 0 ? (
                       <div className="text-center py-8 text-gray-500">
                         <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                         <p className="text-lg font-semibold">No hay sesiones de entrenamiento</p>
                         <p className="text-sm">Crea una nueva sesión para comenzar</p>
                       </div>
                     ) : (
                       filteredSessions.map((session) => (
                         <div key={session.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                           <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                             <div className="flex items-start space-x-3 min-w-0 flex-1">
                               <div className={`p-2 rounded-lg ${getTypeGradient(session.training_type)} text-white flex-shrink-0`}>
                                 {getTypeIcon(session.training_type)}
                               </div>
                               <div className="min-w-0 flex-1">
                                 <h4 className="font-semibold text-gray-800 text-sm truncate">{session.name}</h4>
                                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                                   <span className="flex items-center flex-shrink-0">
                                     <Clock className="h-3 w-3 mr-1" />
                                     {session.start_time} - {session.end_time}
                                   </span>
                                   <span className="flex items-center flex-shrink-0">
                                     <Calendar className="h-3 w-3 mr-1" />
                                     {new Date(session.date).toLocaleDateString('es-ES')}
                                   </span>
                                   <span className="flex items-center flex-shrink-0">
                                     <MapPin className="h-3 w-3 mr-1" />
                                     <span className="truncate max-w-20">{session.location || 'No especificado'}</span>
                                   </span>
                                 </div>
                                 <p className="text-xs text-gray-500 mt-1 truncate">Coach: {session.coach}</p>
                               </div>
                             </div>
                             <div className="flex items-center justify-between lg:justify-end gap-3 flex-shrink-0">
                               <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(session.status)}`}>
                                 {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('-', ' ')}
                               </span>
                                <div className="flex gap-1 flex-shrink-0">
                                  {session.status === 'scheduled' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="p-2"
                                      onClick={() => setShowCalendarDialog(true)}
                                      title="Ver calendario"
                                    >
                                      <Play className="h-3 w-3" />
                                    </Button>
                                  )}
                                 {session.status === 'in-progress' && (
                                   <Button size="sm" variant="outline" className="p-2">
                                     <Pause className="h-3 w-3" />
                                   </Button>
                                 )}
                                  <EditTrainingDialog session={session}>
                                    <Button size="sm" variant="outline" className="p-2">
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </EditTrainingDialog>
                               </div>
                             </div>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 )}
               </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="xl:col-span-1">
            <Card className="argon-card argon-gradient-purple text-white h-full">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Training Control</h3>
                  <p className="text-purple-100 mb-6 text-sm">Quick actions for training management</p>
                  <div className="space-y-3">
                    {(isAdmin) && (
                      <CreateTrainingDialog>
                        <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 text-sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule Session
                        </Button>
                      </CreateTrainingDialog>
                    )}
                    <QuickAttendanceDialog>
                      <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Register Attendance
                      </Button>
                    </QuickAttendanceDialog>
                    <Button 
                      variant="outline" 
                      className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-sm"
                      onClick={() => window.location.href = '/training/calendar'}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Calendario
                    </Button>
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-sm">
                      <Activity className="h-4 w-4 mr-2" />
                      Performance Reports
                    </Button>
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-sm">
                      <Trophy className="h-4 w-4 mr-2" />
                      Competition Prep
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${program.color} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">
                          {program.name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-800 text-sm block truncate">{program.name}</span>
                        <p className="text-xs text-gray-500">{program.athletes} athletes enrolled</p>
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

        {/* Calendar Dialog */}
        <CalendarViewDialog
          open={showCalendarDialog}
          onOpenChange={setShowCalendarDialog}
        />
      </div>
    </DashboardLayout>
  );
};

export default Training;
