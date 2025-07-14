
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Home, Users, Calendar, Trophy, DollarSign, Settings, Cog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import TopNavigation from './TopNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole?: string;
}

const DashboardLayout = ({ children, title, userRole = 'User' }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate('/login');
  };

  const navigationItems = [
    { title: "Dashboard", icon: Home, path: "/" },
    { title: "Athletes", icon: Users, path: "/athletes" },
    { title: "Training", icon: Calendar, path: "/training" },
    { title: "Competitions", icon: Trophy, path: "/competitions" },
    { title: "Finance", icon: DollarSign, path: "/finance" },
    { title: "Configurar Club", icon: Cog, path: "/club-config" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 argon-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 argon-gradient-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-800">SpeedSkate Academy</span>
            </div>
            
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <div 
                  key={item.title}
                  className={`argon-sidebar-item ${window.location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span className={window.location.pathname === item.path ? 'font-medium' : ''}>{item.title}</span>
                  </div>
                </div>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-6 border-t border-gray-200">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Enhanced Navigation */}
        <div className="flex items-center justify-between p-4 lg:hidden bg-background border-b">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
        
        <TopNavigation 
          userRole={userRole}
          userEmail={localStorage.getItem('userEmail') || undefined}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
