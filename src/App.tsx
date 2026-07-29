import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { TranslationProvider } from "@/providers/TranslationProvider";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import AthleteTraining from "./pages/AthleteTraining";
import AthleteCompetitions from "./pages/AthleteCompetitions";
import DelegateAthletes from "./pages/DelegateAthletes";
import DelegateCompetitions from "./pages/DelegateCompetitions";
import DelegatePayments from "./pages/DelegatePayments";
import DelegateTraining from "./pages/DelegateTraining";
import DelegateReports from "./pages/DelegateReports";
import Tiempos from "./pages/Tiempos";

const queryClient = new QueryClient();

// Componente para redirigir usuarios según su rol
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  
  if (loading || profileLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (profile?.role) {
    switch (profile.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'coach':
        return <Navigate to="/coach-dashboard" replace />;
      case 'athlete':
        return <Navigate to="/athlete-dashboard" replace />;
      case 'delegate':
        return <Navigate to="/delegate-dashboard" replace />;
      case 'leader':
        return <Navigate to="/leader-dashboard" replace />;
      case 'finance':
        return <Navigate to="/finance-dashboard" replace />;
      default:
        return <Navigate to="/athlete-dashboard" replace />;
    }
  }
  
  // Default fallback
  return <Navigate to="/athlete-dashboard" replace />;
};

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  
  if (loading || profileLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    // Redirect to user's appropriate dashboard
    switch (profile.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'coach':
        return <Navigate to="/coach-dashboard" replace />;
      case 'athlete':
        return <Navigate to="/athlete-dashboard" replace />;
      case 'delegate':
        return <Navigate to="/delegate-dashboard" replace />;
      case 'leader':
        return <Navigate to="/leader-dashboard" replace />;
      case 'finance':
        return <Navigate to="/finance-dashboard" replace />;
      default:
        return <Navigate to="/athlete-dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="skate-theme"
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/app" element={<RoleBasedRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/athletes" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                <Athletes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/training" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'coach', 'athlete', 'leader', 'delegate']}>
                <Training />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/tiempos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                <Tiempos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training/calendar"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coach', 'athlete', 'leader']}>
                <TrainingCalendar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/competitions" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'delegate', 'coach', 'athlete', 'leader']}>
                <Competitions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'finance', 'leader']}>
                <Finance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/club-config" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader']}>
                <ClubConfig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-management" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/athlete-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delegate-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['delegate']}>
                <DelegateDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['finance']}>
                <FinanceDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leader-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['leader']}>
                <LeaderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'finance']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/athlete/training" 
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteTraining />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/athlete/competitions" 
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteCompetitions />
              </ProtectedRoute>
            } 
            />
          {/* Delegate Routes */}
          <Route 
            path="/delegate/athletes" 
            element={
              <ProtectedRoute allowedRoles={['delegate']}>
                <DelegateAthletes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delegate/competitions" 
            element={
              <ProtectedRoute allowedRoles={['delegate']}>
                <DelegateCompetitions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delegate/payments" 
            element={
              <ProtectedRoute allowedRoles={['delegate']}>
                <DelegatePayments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delegate/training" 
            element={
              <ProtectedRoute allowedRoles={['delegate']}>
                <DelegateTraining />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delegate/reports" 
            element={
              <ProtectedRoute allowedRoles={['delegate']}>
                <DelegateReports />
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
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
