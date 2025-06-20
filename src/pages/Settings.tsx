
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Lock,
  Globe,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  Calendar,
  Trophy,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    training: true,
    competitions: false,
    finance: true
  });

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    });
  };

  const quickStats = [
    { 
      title: "ACCOUNT STATUS", 
      value: "Active", 
      change: "Premium Plan", 
      period: "expires in 30 days",
      icon: User,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "STORAGE USED", 
      value: "2.4 GB", 
      change: "45%", 
      period: "of 5 GB limit",
      icon: Database,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    { 
      title: "API CALLS", 
      value: "1,247", 
      change: "+12%", 
      period: "this month",
      icon: Globe,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    { 
      title: "SECURITY SCORE", 
      value: "98%", 
      change: "Excellent", 
      period: "last updated today",
      icon: Shield,
      bgColor: "argon-gradient-purple",
      isPositive: true
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 argon-sidebar z-50 hidden lg:block">
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
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item" onClick={() => navigate('/athletes')}>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <span>Athletes</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item" onClick={() => navigate('/training')}>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5" />
                <span>Training</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item" onClick={() => navigate('/competitions')}>
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5" />
                <span>Competitions</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item" onClick={() => navigate('/finance')}>
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5" />
                <span>Finance</span>
              </div>
            </div>
            
            <div className="argon-sidebar-item active">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="h-5 w-5" />
                <span className="font-medium">Settings</span>
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
      <div className="lg:ml-64 p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>
              <p className="text-gray-600">Manage your account preferences and system configuration</p>
            </div>
            <Button onClick={handleSaveSettings} className="argon-gradient-blue text-white w-full lg:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="argon-card relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div className="min-w-0 flex-1">
                  <CardDescription className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {stat.title}
                  </CardDescription>
                  <CardTitle className="text-xl lg:text-2xl font-bold text-gray-800 truncate">
                    {stat.value}
                  </CardTitle>
                </div>
                <div className={`p-2 lg:p-3 rounded-lg ${stat.bgColor} text-white shadow-lg flex-shrink-0`}>
                  <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
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

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-1">
            <TabsTrigger value="profile" className="text-xs lg:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="security" className="text-xs lg:text-sm">Security</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs lg:text-sm">Notifications</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs lg:text-sm hidden lg:block">Preferences</TabsTrigger>
            <TabsTrigger value="system" className="text-xs lg:text-sm hidden lg:block">System</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john.doe@speedskate.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" placeholder="Tell us about yourself..." />
                  </div>
                </CardContent>
              </Card>

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Upload and manage your profile image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="flex flex-col space-y-2 w-full lg:w-auto">
                      <Button variant="outline" size="sm" className="w-full lg:w-auto">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                      <Button variant="outline" size="sm" className="w-full lg:w-auto">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Recommended: Square image, at least 400x400px
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Password & Authentication</span>
                  </CardTitle>
                  <CardDescription>Manage your password and two-factor authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="currentPassword" 
                        type={showPassword ? "text" : "password"} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="w-full">Update Password</Button>
                </CardContent>
              </Card>

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Options</span>
                  </CardTitle>
                  <CardDescription>Configure additional security measures</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Login Notifications</p>
                      <p className="text-sm text-gray-500">Get notified of new logins</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Choose how you want to be notified about important events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Email Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Training Updates</span>
                        <Switch 
                          checked={notifications.training}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, training: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Competition Results</span>
                        <Switch 
                          checked={notifications.competitions}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, competitions: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Financial Reports</span>
                        <Switch 
                          checked={notifications.finance}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, finance: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Push Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Urgent Messages</span>
                        <Switch 
                          checked={notifications.push}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, push: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Schedule Changes</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payment Reminders</span>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">SMS Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Emergency Alerts</span>
                        <Switch 
                          checked={notifications.sms}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, sms: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Event Reminders</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payment Confirmations</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Appearance</span>
                  </CardTitle>
                  <CardDescription>Customize the look and feel of your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button variant="outline" size="sm">Light</Button>
                      <Button variant="outline" size="sm">Dark</Button>
                      <Button variant="outline" size="sm">Auto</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm">English</Button>
                      <Button variant="outline" size="sm">Español</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Time Format</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm">12 Hour</Button>
                      <Button variant="outline" size="sm">24 Hour</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle>Dashboard Layout</CardTitle>
                  <CardDescription>Configure your dashboard widgets and layout</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact View</p>
                      <p className="text-sm text-gray-500">Show more information in less space</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-refresh Data</p>
                      <p className="text-sm text-gray-500">Automatically update dashboard data</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Tooltips</p>
                      <p className="text-sm text-gray-500">Display helpful hints and tips</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Data Management</span>
                  </CardTitle>
                  <CardDescription>Export, import, and manage your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Settings
                  </Button>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">Danger Zone</p>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>View system status and performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">App Version</span>
                      <span className="text-sm font-medium">v2.1.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Updated</span>
                      <span className="text-sm font-medium">2 days ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Server Status</span>
                      <span className="text-sm font-medium text-green-600">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">API Status</span>
                      <span className="text-sm font-medium text-green-600">Operational</span>
                    </div>
                  </div>
                  <Separator />
                  <Button variant="outline" size="sm" className="w-full">
                    Check for Updates
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
