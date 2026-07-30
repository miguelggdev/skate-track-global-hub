
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Lock,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Users,
  Activity,
  Trophy,
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
  const [changingPwd, setChangingPwd] = useState(false);
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    training: true,
    competitions: false,
    finance: true,
    scheduleChanges: false,
    paymentReminders: true,
    eventReminders: false,
    paymentConfirmations: true,
  });

  const [securityPrefs, setSecurityPrefs] = useState({
    two_factor: false,
    login_notifications: true,
    session_timeout: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: '',
      });
      setProfilePhotoUrl(null);

      const fetchFullProfile = async () => {
        try {
          const { data: fullProfile } = await supabase
            .from('profiles')
            .select('phone, avatar_url')
            .eq('id', profile.id)
            .single();

          if (fullProfile) {
            setFormData(prev => ({ ...prev, phone: fullProfile.phone || '' }));
            setProfilePhotoUrl(fullProfile.avatar_url);
          }
        } catch {
          // no-op
        }
      };

      fetchFullProfile();
    }
  }, [profile]);

  // Load security preferences from system_settings on mount
  useEffect(() => {
    const loadSecurityPrefs = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['two_factor', 'login_notifications', 'session_timeout']);

      if (data && data.length > 0) {
        const mapped = data.reduce<Record<string, boolean>>((acc, s) => {
          acc[s.setting_key] = s.setting_value === 'true';
          return acc;
        }, {});
        setSecurityPrefs(prev => ({ ...prev, ...mapped }));
      }
    };
    loadSecurityPrefs();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.newPass || passwords.newPass !== passwords.confirm) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' });
      return;
    }
    if (passwords.newPass.length < 6) {
      toast({ title: 'Error', description: 'Mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    setChangingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Contraseña actualizada correctamente' });
      setPasswords({ newPass: '', confirm: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo actualizar la contraseña', variant: 'destructive' });
    } finally {
      setChangingPwd(false);
    }
  };

  const handleSecurityPref = async (key: keyof typeof securityPrefs, value: boolean) => {
    setSecurityPrefs(prev => ({ ...prev, [key]: value }));
    try {
      await supabase.from('system_settings').upsert({
        setting_key: key,
        setting_value: String(value),
        setting_type: 'boolean',
        category: 'security',
      }, { onConflict: 'setting_key' });
      toast({ title: 'Preferencia guardada' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la preferencia', variant: 'destructive' });
      setSecurityPrefs(prev => ({ ...prev, [key]: !value }));
    }
  };

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const { data: appStats } = useQuery({
    queryKey: ['settings-app-stats'],
    queryFn: async () => {
      const [athletesRes, usersRes, sessionsRes, competitionsRes] = await Promise.all([
        supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('training_sessions').select('id', { count: 'exact' }).gte('scheduled_at', monthStart),
        supabase.from('competitions').select('id', { count: 'exact' }).gte('start_date', yearStart),
      ]);
      return {
        athletes: athletesRes.count ?? 0,
        users: usersRes.count ?? 0,
        sessions: sessionsRes.count ?? 0,
        competitions: competitionsRes.count ?? 0,
      };
    },
  });

  const quickStats = [
    {
      title: 'DEPORTISTAS ACTIVOS',
      value: appStats?.athletes ?? '—',
      change: 'En el club',
      period: 'estado activo',
      icon: Users,
      bgColor: 'argon-gradient-blue',
      isPositive: true,
    },
    {
      title: 'USUARIOS TOTALES',
      value: appStats?.users ?? '—',
      change: 'Registrados',
      period: 'en el sistema',
      icon: User,
      bgColor: 'argon-gradient-green',
      isPositive: true,
    },
    {
      title: 'SESIONES DEL MES',
      value: appStats?.sessions ?? '—',
      change: 'Entrenamientos',
      period: 'este mes',
      icon: Activity,
      bgColor: 'argon-gradient-orange',
      isPositive: true,
    },
    {
      title: 'COMPETENCIAS',
      value: appStats?.competitions ?? '—',
      change: 'Este año',
      period: 'programadas',
      icon: Trophy,
      bgColor: 'argon-gradient-purple',
      isPositive: true,
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

          {/* Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Información Personal</span>
                  </CardTitle>
                  <CardDescription>Actualiza tus datos personales y de contacto</CardDescription>
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
                    <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar</p>
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
                      window.location.reload();
                    }}
                    userId={profile?.id}
                    className="flex justify-center"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Seguridad */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Contraseña y Autenticación</span>
                  </CardTitle>
                  <CardDescription>Gestiona tu contraseña y autenticación de dos factores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwords.newPass}
                        onChange={(e) => setPasswords(prev => ({ ...prev, newPass: e.target.value }))}
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
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full" onClick={handleChangePassword} disabled={changingPwd}>
                    {changingPwd ? 'Actualizando…' : 'Actualizar Contraseña'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Opciones de Seguridad</span>
                  </CardTitle>
                  <CardDescription>Configura medidas de seguridad adicionales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Autenticación de Dos Factores</p>
                      <p className="text-sm text-gray-500">Agrega una capa extra de seguridad</p>
                    </div>
                    <Switch
                      checked={securityPrefs.two_factor}
                      onCheckedChange={(v) => handleSecurityPref('two_factor', v)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificaciones de Inicio de Sesión</p>
                      <p className="text-sm text-gray-500">Recibe avisos de nuevos inicios de sesión</p>
                    </div>
                    <Switch
                      checked={securityPrefs.login_notifications}
                      onCheckedChange={(v) => handleSecurityPref('login_notifications', v)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cierre de Sesión Automático</p>
                      <p className="text-sm text-gray-500">Cierre automático tras período de inactividad</p>
                    </div>
                    <Switch
                      checked={securityPrefs.session_timeout}
                      onCheckedChange={(v) => handleSecurityPref('session_timeout', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notificaciones */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="argon-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Preferencias de Notificaciones</span>
                </CardTitle>
                <CardDescription>Elige cómo quieres recibir notificaciones sobre eventos importantes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notificaciones por Email</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Actualizaciones de Entrenamientos</span>
                        <Switch
                          checked={notifications.training}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, training: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Resultados de Competencias</span>
                        <Switch
                          checked={notifications.competitions}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, competitions: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Reportes Financieros</span>
                        <Switch
                          checked={notifications.finance}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, finance: v }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notificaciones Push</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mensajes Urgentes</span>
                        <Switch
                          checked={notifications.push}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, push: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cambios de Horario</span>
                        <Switch
                          checked={notifications.scheduleChanges}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, scheduleChanges: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Recordatorios de Pago</span>
                        <Switch
                          checked={notifications.paymentReminders}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, paymentReminders: v }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notificaciones SMS</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alertas de Emergencia</span>
                        <Switch
                          checked={notifications.sms}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, sms: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Recordatorios de Eventos</span>
                        <Switch
                          checked={notifications.eventReminders}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, eventReminders: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Confirmaciones de Pago</span>
                        <Switch
                          checked={notifications.paymentConfirmations}
                          onCheckedChange={(v) => setNotifications(prev => ({ ...prev, paymentConfirmations: v }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferencias */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LanguageSelector />

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>{t('settings.preferences')}</span>
                  </CardTitle>
                  <CardDescription>Personaliza la apariencia y el formato de la aplicación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tema</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button variant="outline" size="sm">Claro</Button>
                      <Button variant="outline" size="sm">Oscuro</Button>
                      <Button variant="outline" size="sm">Auto</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Moneda</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Select defaultValue="COP">
                        <SelectTrigger className="col-span-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COP">Peso Colombiano (COP$)</SelectItem>
                          <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                          <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Formato de Hora</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm">12 Horas</Button>
                      <Button variant="outline" size="sm">24 Horas</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="argon-card">
              <CardHeader>
                <CardTitle>Diseño del Dashboard</CardTitle>
                <CardDescription>Configura los widgets y la distribución de tu dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Vista Compacta</p>
                    <p className="text-sm text-gray-500">Muestra más información en menos espacio</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Actualización Automática</p>
                    <p className="text-sm text-gray-500">Actualiza automáticamente los datos del dashboard</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar Tooltips</p>
                    <p className="text-sm text-gray-500">Muestra sugerencias y consejos de ayuda</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sistema */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="argon-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Gestión de Datos</span>
                  </CardTitle>
                  <CardDescription>Exporta, importa y gestiona tus datos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start"
                    onClick={() => toast({ title: 'Próximamente', description: 'Exportación de datos disponible pronto' })}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Datos
                  </Button>
                  <Button variant="outline" className="w-full justify-start"
                    onClick={() => toast({ title: 'Próximamente', description: 'Importación de datos disponible pronto' })}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Datos
                  </Button>
                  <Button variant="outline" className="w-full justify-start"
                    onClick={() => toast({ title: 'Próximamente', description: 'Backup de configuración disponible pronto' })}>
                    <Database className="h-4 w-4 mr-2" />
                    Backup de Configuración
                  </Button>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">Zona de Peligro</p>
                    <Button variant="destructive" size="sm"
                      onClick={() => toast({ title: 'Acción restringida', description: 'Contacta al administrador para eliminar tu cuenta', variant: 'destructive' })}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Cuenta
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="argon-card">
                <CardHeader>
                  <CardTitle>Información del Sistema</CardTitle>
                  <CardDescription>Consulta el estado del sistema y métricas de rendimiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Versión de la App</span>
                      <span className="text-sm font-medium">v2.1.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Última Actualización</span>
                      <span className="text-sm font-medium">Julio 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Estado del Servidor</span>
                      <span className="text-sm font-medium text-green-600">En línea</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Estado de la API</span>
                      <span className="text-sm font-medium text-green-600">Operacional</span>
                    </div>
                  </div>
                  <Separator />
                  <Button variant="outline" size="sm" className="w-full"
                    onClick={() => toast({ title: 'Sistema actualizado', description: 'Estás usando la versión más reciente' })}>
                    Buscar Actualizaciones
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestión de Usuarios - Solo Admin */}
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
