
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import UserManagementTab from '@/components/settings/UserManagementTab';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { PhotoUpload } from '@/components/users/PhotoUpload';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { profile, loading, isAdmin } = useUserProfile();
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    training: true,
    competitions: false,
    finance: true
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: '',
        bio: ''
      });
      setProfilePhotoUrl(null);
      
      // Fetch additional profile data that might not be in UserProfile
      const fetchFullProfile = async () => {
        try {
          const { data: fullProfile } = await supabase
            .from('profiles')
            .select('phone, bio, avatar_url')
            .eq('id', profile.id)
            .single();
            
          if (fullProfile) {
            setFormData(prev => ({
              ...prev,
              phone: fullProfile.phone || '',
              bio: fullProfile.bio || ''
            }));
            setProfilePhotoUrl(fullProfile.avatar_url);
          }
        } catch (error) {
        }
      };
      
      fetchFullProfile();
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          bio: formData.bio
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: t('message.saved_successfully'),
        description: t('message.updated_successfully'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('message.error_occurred'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
    <DashboardLayout title={t('settings.title')}>
      <div className="min-h-full pb-6">
        {/* Sticky Header Actions */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mb-6">
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings} 
              disabled={saving || loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('common.loading') : t('action.save')}
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
          <TabsList className={`grid w-full gap-1 ${isAdmin ? 'grid-cols-3 lg:grid-cols-6' : 'grid-cols-3 lg:grid-cols-5'}`}>
            <TabsTrigger value="profile" className="text-xs lg:text-sm">{t('settings.profile')}</TabsTrigger>
            <TabsTrigger value="security" className="text-xs lg:text-sm">{t('settings.security')}</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs lg:text-sm">{t('settings.notifications')}</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs lg:text-sm hidden lg:block">{t('settings.preferences')}</TabsTrigger>
            <TabsTrigger value="system" className="text-xs lg:text-sm hidden lg:block">{t('settings.system')}</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="text-xs lg:text-sm">
                <Users className="h-3 w-3 mr-1 lg:mr-2" />
                {t('menu.users')}
              </TabsTrigger>
            )}
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
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input 
                        id="firstName" 
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Ingresa tu nombre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input 
                        id="lastName" 
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Ingresa tu apellido"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      El email no se puede cambiar
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Ingresa tu teléfono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Biografía</Label>
                    <Input 
                      id="bio" 
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Cuéntanos sobre ti..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle>Foto de Perfil</CardTitle>
                  <CardDescription>Sube y gestiona tu imagen de perfil</CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoUpload
                    currentPhotoUrl={profilePhotoUrl}
                    onPhotoChange={(url) => {
                      setProfilePhotoUrl(url);
                      // Force a refresh of the user profile to update the avatar in the session
                      window.location.reload();
                    }}
                    userId={profile?.id}
                    className="flex justify-center"
                  />
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
              {/* Language Selector - Full i18n system */}
              <LanguageSelector />

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>{t('settings.preferences')}</span>
                  </CardTitle>
                  <CardDescription>{t('common.description')}</CardDescription>
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
                    <Label>Currency</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Select defaultValue="COP">
                        <SelectTrigger className="col-span-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COP">Peso Colombiano (COP$)</SelectItem>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                          <SelectItem value="GBP">British Pound (£)</SelectItem>
                        </SelectContent>
                      </Select>
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
            </div>

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

          {/* User Management Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserManagementTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
