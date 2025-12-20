
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Home, Users, Calendar, Trophy, DollarSign, Settings, Cog, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import TopNavigation from './TopNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole?: string;
}

const DashboardLayout = ({ children, title, userRole = 'User' }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  console.log('DashboardLayout: Rendering with profile:', {
    profile,
    profileLoading,
    userEmail: user?.email
  });

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate('/login');
  };

  // Base navigation items - paths will be overridden for athlete role
  const getNavigationItems = (role?: string) => {
    // Athlete-specific paths
    if (role === 'athlete') {
      return [
        { title: "Dashboard", icon: Home, path: "/athlete-dashboard" },
        { title: "Training", icon: Calendar, path: "/athlete/training" },
        { title: "Competitions", icon: Trophy, path: "/athlete/competitions" },
        { title: "Settings", icon: Settings, path: "/settings" },
      ];
    }
    
    // All other roles use standard paths
    return [
      { title: "Dashboard", icon: Home, path: "/" },
      { title: "Athletes", icon: Users, path: "/athletes" },
      { title: "Training", icon: Calendar, path: "/training" },
      { title: "Competitions", icon: Trophy, path: "/competitions" },
      { title: "Finance", icon: DollarSign, path: "/finance" },
      { title: "Configurar Club", icon: Cog, path: "/club-config" },
      { title: "Settings", icon: Settings, path: "/settings" },
    ];
  };

  // Map role to dashboard path and role label
  const getDashboardPath = (role?: string) => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'coach':
        return '/coach-dashboard';
      case 'athlete':
        return '/athlete-dashboard';
      case 'delegate':
        return '/delegate-dashboard';
      case 'leader':
        return '/leader-dashboard';
      case 'finance':
        return '/finance-dashboard';
      default:
        return '/';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'coach':
        return 'Entrenador';
      case 'athlete':
        return 'Deportista';
      case 'delegate':
        return 'Delegado';
      case 'leader':
        return 'Líder';
      case 'finance':
        return 'Finanzas';
      default:
        return 'Usuario';
    }
  };

  // Filter navigation items based on user role
  const getVisibleNavigationItems = () => {
    const role = profile?.role;

    console.log('DashboardLayout: Getting navigation items for role:', role);

    // Get role-specific navigation items
    const roleItems = getNavigationItems(role);
    
    // For athlete role, return items directly (already filtered)
    if (role === 'athlete') {
      console.log('DashboardLayout: Athlete navigation items:', roleItems);
      return roleItems;
    }

    // Determine which items are allowed per role (for non-athletes)
    const allowedByRole: Record<string, string[]> = {
      admin: [
        'Dashboard', 'Athletes', 'Training', 'Competitions', 'Finance', 'Configurar Club', 'Settings'
      ],
      coach: [
        'Dashboard', 'Athletes', 'Training', 'Competitions', 'Settings'
      ],
      delegate: [
        'Dashboard', 'Competitions', 'Settings'
      ],
      leader: [
        'Dashboard', 'Athletes', 'Training', 'Competitions', 'Finance', 'Configurar Club', 'Settings'
      ],
      finance: [
        'Dashboard', 'Finance', 'Settings'
      ],
    } as const;

    const titles = role ? allowedByRole[role as keyof typeof allowedByRole] : roleItems.map(i => i.title).filter(t => t !== 'Configurar Club');

    console.log('DashboardLayout: Allowed titles for role:', { role, titles });

    // Apply role-based dashboard path and filter by allowed titles
    const items = roleItems
      .map((item) => item.title === 'Dashboard' ? { ...item, path: getDashboardPath(role) } : item)
      .filter((item) => titles?.includes(item.title));

    console.log('DashboardLayout: Final navigation items:', items);
    return items;
  };

  // Show loading state if profile is still loading
  if (profileLoading) {
    return (
      <div className="flex h-screen bg-background dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const navigationItems = getVisibleNavigationItems();

  return (
    <div className="flex h-screen bg-background dark:bg-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 pt-16 bg-white dark:bg-gray-800 border-r border-border dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-foreground dark:text-gray-100">SpeedSkate Academy</span>
            </div>
            
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <div 
                  key={item.title}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    window.location.pathname === item.path 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-foreground dark:text-gray-300 hover:bg-muted dark:hover:bg-gray-700 hover:text-foreground dark:hover:text-gray-100'
                  }`}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={window.location.pathname === item.path ? 'font-medium' : ''}>{item.title}</span>
                </div>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-6 border-t border-border dark:border-gray-700">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {user?.email}
            </p>
            <Button 
              onClick={handleLogout} 
              className="w-full justify-start"
              variant="outline"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation - Fixed */}
        <TopNavigation 
          userRole={getRoleLabel(profile?.role)}
          userEmail={user?.email || undefined}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />


        {/* Main Content with proper top padding for fixed header */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 pt-20 lg:pt-20">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
