
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
  const { profile } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate('/login');
  };

  const allNavigationItems = [
    { title: "Dashboard", icon: Home, path: "/" },
    { title: "Athletes", icon: Users, path: "/athletes" },
    { title: "Training", icon: Calendar, path: "/training" },
    { title: "Competitions", icon: Trophy, path: "/competitions" },
    { title: "Finance", icon: DollarSign, path: "/finance" },
    { title: "Configurar Club", icon: Cog, path: "/club-config" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];

  // Filter navigation items based on user role
  const getVisibleNavigationItems = () => {
    // Hide "Configurar Club" during loading and for restricted roles
    if (!profile) return allNavigationItems.filter(item => item.title !== "Configurar Club");

    // Hide "Configurar Club" for athlete, delegate, and finance roles
    const restrictedRoles = ['athlete', 'delegate', 'finance'];
    
    if (restrictedRoles.includes(profile.role)) {
      return allNavigationItems.filter(item => item.title !== "Configurar Club");
    }
    
    return allNavigationItems;
  };

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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted dark:hover:bg-gray-700 ${
                    window.location.pathname === item.path 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200'
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
          userRole={userRole}
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
