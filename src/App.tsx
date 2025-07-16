import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import AthleteDashboard from "./pages/AthleteDashboard";
import NotFound from "./pages/NotFound";
import DelegateDashboard from "./pages/DelegateDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import LeaderDashboard from "./pages/LeaderDashboard";
import Athletes from "./pages/Athletes";
import Training from "./pages/Training";
import TrainingCalendar from "./pages/TrainingCalendar";
import Competitions from "./pages/Competitions";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import ClubConfig from "./pages/ClubConfig";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // For now, allow all authenticated users - roles will be checked via database
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/athletes" element={<Athletes />} />
          <Route path="/training" element={<Training />} />
          <Route path="/training/calendar" element={<TrainingCalendar />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
          <Route 
            path="/club-config" 
            element={
              <ProtectedRoute>
                <ClubConfig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-management" 
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach-dashboard" 
            element={
              <ProtectedRoute>
                <CoachDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/athlete-dashboard" 
            element={
              <ProtectedRoute>
                <AthleteDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delegate-dashboard" 
            element={
              <ProtectedRoute>
                <DelegateDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance-dashboard" 
            element={
              <ProtectedRoute>
                <FinanceDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leader-dashboard" 
            element={
              <ProtectedRoute>
                <LeaderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
