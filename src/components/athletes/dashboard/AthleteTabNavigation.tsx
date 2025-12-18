import React from 'react';
import { 
  User, 
  Activity, 
  Heart, 
  Clock, 
  FolderOpen, 
  Users, 
  Phone, 
  GraduationCap, 
  Footprints, 
  Wrench, 
  CreditCard, 
  Gamepad2,
  ChevronDown,
  Menu
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface SubTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PrimaryTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subTabs: SubTab[];
}

const primaryTabs: PrimaryTab[] = [
  {
    id: 'profile',
    label: 'Perfil',
    icon: User,
    subTabs: [
      { id: 'family', label: 'Familia', icon: Users },
      { id: 'contact', label: 'Contacto', icon: Phone },
      { id: 'studies', label: 'Estudios', icon: GraduationCap }
    ]
  },
  {
    id: 'training',
    label: 'Entrenamientos',
    icon: Activity,
    subTabs: [
      { id: 'skates', label: 'Patines', icon: Footprints },
      { id: 'maintenance', label: 'Mantenimiento', icon: Wrench }
    ]
  },
  {
    id: 'body',
    label: 'Mi Cuerpo',
    icon: Heart,
    subTabs: []
  },
  {
    id: 'history',
    label: 'Historial',
    icon: Clock,
    subTabs: []
  },
  {
    id: 'files',
    label: 'Archivos',
    icon: FolderOpen,
    subTabs: [
      { id: 'payments', label: 'Pagos', icon: CreditCard },
      { id: 'hobbies', label: 'Hobbys', icon: Gamepad2 }
    ]
  }
];

// Get all tabs flat for mobile
const getAllTabs = () => {
  const allTabs: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [];
  primaryTabs.forEach(tab => {
    allTabs.push({ id: tab.id, label: tab.label, icon: tab.icon, group: tab.label });
    tab.subTabs.forEach(sub => {
      allTabs.push({ id: sub.id, label: sub.label, icon: sub.icon, group: tab.label });
    });
  });
  return allTabs;
};

// Check if a tab is active (either primary or one of its children)
const isTabActive = (tabId: string, activeTab: string): boolean => {
  if (tabId === activeTab) return true;
  const primary = primaryTabs.find(t => t.id === tabId);
  if (primary) {
    return primary.subTabs.some(sub => sub.id === activeTab);
  }
  return false;
};

// Get active tab info for mobile display
const getActiveTabInfo = (activeTab: string) => {
  for (const primary of primaryTabs) {
    if (primary.id === activeTab) {
      return { label: primary.label, icon: primary.icon };
    }
    const sub = primary.subTabs.find(s => s.id === activeTab);
    if (sub) {
      return { label: sub.label, icon: sub.icon };
    }
  }
  return { label: 'Perfil', icon: User };
};

export const AthleteTabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeInfo = getActiveTabInfo(activeTab);

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab.id, activeTab);
          const hasDropdown = tab.subTabs.length > 0;

          if (hasDropdown) {
            return (
              <DropdownMenu key={tab.id}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                      "hover:bg-background hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isActive 
                        ? "bg-background text-primary shadow-sm border border-border/50" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{tab.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-48 bg-popover border border-border shadow-lg z-50"
                >
                  <DropdownMenuItem 
                    onClick={() => handleTabSelect(tab.id)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      activeTab === tab.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {tab.subTabs.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <DropdownMenuItem
                        key={sub.id}
                        onClick={() => handleTabSelect(sub.id)}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer",
                          activeTab === sub.id && "bg-accent text-accent-foreground"
                        )}
                      >
                        <SubIcon className="h-4 w-4" />
                        {sub.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                "hover:bg-background hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive 
                  ? "bg-background text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between h-12 px-4"
            >
              <div className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                <activeInfo.icon className="h-4 w-4" />
                <span>{activeInfo.label}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Navegación</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 overflow-y-auto max-h-[calc(70vh-80px)]">
              {primaryTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <div key={tab.id} className="space-y-1">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide px-0">
                      {tab.label}
                    </DropdownMenuLabel>
                    <button
                      onClick={() => handleTabSelect(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                        activeTab === tab.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                    {tab.subTabs.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleTabSelect(sub.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 pl-8 rounded-lg text-sm transition-colors",
                            activeTab === sub.id 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <SubIcon className="h-4 w-4" />
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default AthleteTabNavigation;
