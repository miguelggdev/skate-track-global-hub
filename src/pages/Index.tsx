import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  UserPlus, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  Settings,
  BarChart3,
  Trophy,
  Menu,
  Home,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Index = () => {
  const navigate = useNavigate();

  const stats = [
    { 
      title: "TODAY'S MONEY", 
      value: "$53,000", 
      change: "+55%", 
      period: "since yesterday",
      icon: DollarSign,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "TODAY'S USERS", 
      value: "2,300", 
      change: "+3%", 
      period: "since last week",
      icon: Users,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
    { 
      title: "NEW CLIENTS", 
      value: "+3,462", 
      change: "-2%", 
      period: "since last quarter",
      icon: UserPlus,
      bgColor: "argon-gradient-green",
      isPositive: false
    },
    { 
      title: "SALES", 
      value: "$103,430", 
      change: "+5%", 
      period: "than last month",
      icon: ShoppingCart,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
  ];

  const teamMembers = [
    { name: "John Michael", status: "ONLINE", avatar: "👨‍💼" },
    { name: "Alex Smith", status: "IN MEETING", avatar: "👨‍💻" },
    { name: "Samantha Ivy", status: "OFFLINE", avatar: "👩‍💼" },
    { name: "John Michael", status: "ONLINE", avatar: "👨‍🎓" },
  ];

  const todoList = [
    { task: "Call with Dave", time: "09:30 AM", priority: "high" },
    { task: "Brunch Meeting", time: "11:00 AM", priority: "medium" },
    { task: "Argon Dashboard Launch", time: "02:00 PM", priority: "low" },
    { task: "Winter Hackaton", time: "10:30 AM", priority: "high" },
  ];

  const progressProjects = [
    { name: "React Material Dashboard", progress: 60, color: "bg-blue-500" },
    { name: "Argon Design System", progress: 10, color: "bg-red-500" },
    { name: "VueJs Now UI Kit PRO", progress: 100, color: "bg-green-500" },
    { name: "Soft UI Dashboard", progress: 25, color: "bg-purple-500" },
  ];


  // Mock performance data for the chart
  const performanceData = [
    { month: 'Jan', athletes: 45, sessions: 120, completion: 89 },
    { month: 'Feb', athletes: 52, sessions: 140, completion: 92 },
    { month: 'Mar', athletes: 48, sessions: 135, completion: 87 },
    { month: 'Apr', athletes: 61, sessions: 165, completion: 94 },
    { month: 'May', athletes: 58, sessions: 158, completion: 91 },
    { month: 'Jun', athletes: 67, sessions: 180, completion: 96 }
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
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

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Performance Overview */}
            <Card className="lg:col-span-2 argon-card">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">Performance Overview</CardTitle>
                <CardDescription className="text-sm text-gray-600">Athletes performance this season</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
                    <div className="bg-blue-50 rounded-lg p-3 lg:p-4 text-center">
                      <div className="text-xl lg:text-2xl font-bold text-blue-600 mb-1">156</div>
                      <div className="text-xs lg:text-sm text-gray-600">Active Athletes</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 lg:p-4 text-center">
                      <div className="text-xl lg:text-2xl font-bold text-green-600 mb-1">24</div>
                      <div className="text-xs lg:text-sm text-gray-600">Training Sessions</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 lg:p-4 text-center">
                      <div className="text-xl lg:text-2xl font-bold text-purple-600 mb-1">94%</div>
                      <div className="text-xs lg:text-sm text-gray-600">Completion Rate</div>
                    </div>
                  </div>
                  
                  {/* Simple chart representation */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 text-sm lg:text-base">Monthly Progress</h4>
                    {performanceData.slice(-3).map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 w-12">{data.month}</span>
                        <div className="flex-1 mx-4">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${data.completion}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{data.completion}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Get Started Section */}
            <Card className="argon-card argon-gradient-purple text-white">
              <CardContent className="p-4 lg:p-6">
                <div className="text-center">
                  <Activity className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-4 text-white" />
                  <h3 className="text-lg lg:text-xl font-bold mb-4">SpeedSkate Academy</h3>
                  <p className="text-purple-100 mb-6 text-sm lg:text-base">
                    Manage your athletic programs from training to competitions
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/training')}
                      className="w-full bg-white text-purple-600 hover:bg-gray-100 text-sm lg:text-base"
                    >
                      View Training
                    </Button>
                    <Button 
                      onClick={() => navigate('/athletes')}
                      variant="outline" 
                      className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-sm lg:text-base"
                    >
                      Manage Athletes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Team Members */}
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">Team Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg">{member.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <p className={`text-xs px-2 py-1 rounded-full ${
                          member.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                          member.status === 'IN MEETING' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Training Schedule */}
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">Training Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {todoList.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.priority === 'high' ? 'bg-red-500' :
                        item.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-800">{item.task}</p>
                        <p className="text-sm text-gray-600">{item.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Season Progress */}
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">Season Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {progressProjects.map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg ${project.color} flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">
                            {project.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{project.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${project.color}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
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

export default Index;
