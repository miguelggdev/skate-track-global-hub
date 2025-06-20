
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
  BarChart3
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
      bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
      isPositive: true
    },
    { 
      title: "TODAY'S USERS", 
      value: "2,300", 
      change: "+3%", 
      period: "since last week",
      icon: Users,
      bgColor: "bg-gradient-to-r from-red-500 to-red-600",
      isPositive: true
    },
    { 
      title: "NEW CLIENTS", 
      value: "+3,462", 
      change: "-2%", 
      period: "since last quarter",
      icon: UserPlus,
      bgColor: "bg-gradient-to-r from-green-500 to-green-600",
      isPositive: false
    },
    { 
      title: "SALES", 
      value: "$103,430", 
      change: "+5%", 
      period: "than last month",
      icon: ShoppingCart,
      bgColor: "bg-gradient-to-r from-orange-500 to-orange-600",
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Argon Dashboard 2 PRO</span>
          </div>
          
          <nav className="space-y-2">
            <div className="bg-blue-50 border-r-4 border-blue-500 px-4 py-3 rounded-l-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span className="text-blue-700 font-medium">Dashboards</span>
              </div>
            </div>
            
            <div className="px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Landing</span>
              </div>
            </div>
            
            <div className="px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Default</span>
              </div>
            </div>
            
            <div className="px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Automotive</span>
              </div>
            </div>
            
            <div className="px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Smart Home</span>
              </div>
            </div>
            
            <div className="px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Virtual Reality</span>
              </div>
            </div>
            
            <div className="px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>CRM</span>
              </div>
            </div>
          </nav>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">PAGES</p>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full justify-start text-gray-600 bg-transparent hover:bg-gray-50"
              variant="ghost"
            >
              Login to Dashboards
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
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome to SpeedSkate Academy</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-10`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div>
                  <CardDescription className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {stat.title}
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </CardTitle>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} text-white`}>
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
          {/* Sales Overview */}
          <Card className="lg:col-span-2 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Sales Overview</CardTitle>
              <CardDescription className="text-sm text-gray-600">4% more in 2021</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">Chart visualization would go here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Started Section */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">Get started with Argon</h3>
                <p className="text-purple-100 mb-6">
                  Manage your projects from the beginning to end and get amazing results
                </p>
                <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Team Members</CardTitle>
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
                  <Button variant="outline" size="sm">Add</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* To Do List */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">To Do List</CardTitle>
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

          {/* Progress Track */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Progress Track</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {progressProjects.map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg ${project.color} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">
                        {project.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">{project.name}</span>
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
    </div>
  );
};

export default Index;
