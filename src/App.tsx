import React, { Suspense } from 'react';
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
import { useOnboardingGuard } from "@/hooks/useOnboardingGuard";
import { useCurrentClub } from "@/hooks/useCurrentClub";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { PwaReloadPrompt } from "@/components/pwa/PwaReloadPrompt";
import { SuspendedAccountScreen } from "@/components/SuspendedAccountScreen";

// Static imports — always needed immediately (tiny files, auth critical path)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy imports — large feature pages loaded on demand to reduce initial bundle
const Onboarding         = React.lazy(() => import('./pages/Onboarding'));
const AdminDashboard     = React.lazy(() => import('./pages/AdminDashboard'));
const CoachDashboard     = React.lazy(() => import('./pages/CoachDashboard'));
const AthleteDashboard   = React.lazy(() => import('./pages/AthleteDashboard'));
const DelegateDashboard  = React.lazy(() => import('./pages/DelegateDashboard'));
const FinanceDashboard   = React.lazy(() => import('./pages/FinanceDashboard'));
const LeaderDashboard    = React.lazy(() => import('./pages/LeaderDashboard'));
const ParentDashboard    = React.lazy(() => import('./pages/ParentDashboard'));
const Athletes           = React.lazy(() => import('./pages/Athletes'));
const Training           = React.lazy(() => import('./pages/Training'));
const TrainingCalendar   = React.lazy(() => import('./pages/TrainingCalendar'));
const Competitions       = React.lazy(() => import('./pages/Competitions'));
const Finance            = React.lazy(() => import('./pages/Finance'));
const Settings           = React.lazy(() => import('./pages/Settings'));
const UserManagement     = React.lazy(() => import('./pages/UserManagement'));
const ClubConfig         = React.lazy(() => import('./pages/ClubConfig'));
const Reports            = React.lazy(() => import('./pages/Reports'));
const AthleteTraining    = React.lazy(() => import('./pages/AthleteTraining'));
const AthleteCompetitions = React.lazy(() => import('./pages/AthleteCompetitions'));
const DelegateAthletes   = React.lazy(() => import('./pages/DelegateAthletes'));
const DelegateCompetitions = React.lazy(() => import('./pages/DelegateCompetitions'));
const DelegatePayments   = React.lazy(() => import('./pages/DelegatePayments'));
const DelegateTraining   = React.lazy(() => import('./pages/DelegateTraining'));
const DelegateReports    = React.lazy(() => import('./pages/DelegateReports'));
const Tiempos            = React.lazy(() => import('./pages/Tiempos'));
const Documents          = React.lazy(() => import('./pages/Documents'));
const EquipmentPage      = React.lazy(() => import('./pages/EquipmentPage'));
const EvaluationsPage    = React.lazy(() => import('./pages/EvaluationsPage'));
const MessagesPage       = React.lazy(() => import('./pages/MessagesPage'));
const MedicalPage        = React.lazy(() => import('./pages/MedicalPage'));
const AgentChat          = React.lazy(() => import('./pages/AgentChat'));
const PublicAthletePage  = React.lazy(() => import('./pages/PublicAthletePage'));
const Checkin            = React.lazy(() => import('./pages/Checkin'));
const TrainingCheckin    = React.lazy(() => import('./pages/TrainingCheckin'));
const TrainingTimer      = React.lazy(() => import('./pages/TrainingTimer'));
const KnowledgeBase      = React.lazy(() => import('./pages/KnowledgeBase'));
const AutomationsPage    = React.lazy(() => import('./pages/AutomationsPage'));
const AgentsLive         = React.lazy(() => import('./pages/AgentsLive'));
const AgentOffice        = React.lazy(() => import('./pages/AgentOffice'));
const AthleteCardPublic  = React.lazy(() => import('./pages/AthleteCardPublic'));
const SuperAdminDashboard = React.lazy(() => import('./pages/SuperAdminDashboard'));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Componente para redirigir usuarios según su rol
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { club, loading: clubLoading } = useCurrentClub();
  const isAdminOrLeader = profile?.role === 'admin' || profile?.role === 'leader';
  const { needsOnboarding, loading: guardLoading } = useOnboardingGuard(
    !loading && !profileLoading && isAdminOrLeader
  );

  if (loading || profileLoading || clubLoading || (isAdminOrLeader && guardLoading)) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (club && !club.is_active) {
    return <SuspendedAccountScreen />;
  }

  if (profile?.role) {
    if (profile.role === 'admin') {
      return needsOnboarding
        ? <Navigate to="/onboarding" replace />
        : <Navigate to="/admin-dashboard" replace />;
    }
    if (profile.role === 'leader') {
      return needsOnboarding
        ? <Navigate to="/onboarding" replace />
        : <Navigate to="/leader-dashboard" replace />;
    }
    switch (profile.role) {
      case 'coach':    return <Navigate to="/coach-dashboard" replace />;
      case 'athlete':  return <Navigate to="/athlete-dashboard" replace />;
      case 'delegate': return <Navigate to="/delegate-dashboard" replace />;
      case 'finance':  return <Navigate to="/finance-dashboard" replace />;
      case 'parent':   return <Navigate to="/parent-dashboard" replace />;
      default:         return <Navigate to="/athlete-dashboard" replace />;
    }
  }

  return <Navigate to="/athlete-dashboard" replace />;
};

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { club, loading: clubLoading } = useCurrentClub();

  if (loading || profileLoading || clubLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (club && !club.is_active) {
    return <SuspendedAccountScreen />;
  }

  if (allowedRoles && !profile?.role) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    switch (profile.role) {
      case 'admin':    return <Navigate to="/admin-dashboard" replace />;
      case 'coach':    return <Navigate to="/coach-dashboard" replace />;
      case 'athlete':  return <Navigate to="/athlete-dashboard" replace />;
      case 'delegate': return <Navigate to="/delegate-dashboard" replace />;
      case 'leader':   return <Navigate to="/leader-dashboard" replace />;
      case 'finance':  return <Navigate to="/finance-dashboard" replace />;
      case 'parent':   return <Navigate to="/parent-dashboard" replace />;
      default:         return <Navigate to="/athlete-dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Guard aparte para /superadmin: un platform_admin NO tiene por qué
// pertenecer a ningún club (profile?.role puede venir vacío), así que no
// puede reusar ProtectedRoute (que exige un rol de club).
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isPlatformAdmin, loading: paLoading } = usePlatformAdmin();

  if (loading || (!!user && paLoading)) {
    return <PageLoader />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isPlatformAdmin) {
    return <Navigate to="/app" replace />;
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
            <PwaReloadPrompt />
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/app" element={<RoleBasedRedirect />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'leader']}>
                          <Onboarding />
                        </ProtectedRoute>
                      }
                    />
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
                      path="/documentos"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                          <Documents />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/equipamiento"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                          <EquipmentPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/evaluaciones"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                          <EvaluationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mensajes"
                      element={
                        <ProtectedRoute>
                          <MessagesPage />
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
                        <ProtectedRoute allowedRoles={['admin', 'delegate', 'coach', 'athlete', 'leader', 'parent']}>
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
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <AgentChat />
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
                    <Route
                      path="/medico"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                          <MedicalPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/parent-dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['parent', 'admin', 'leader']}>
                          <ParentDashboard />
                        </ProtectedRoute>
                      }
                    />
                    {/* Public pages — no auth required */}
                    <Route path="/publico/atleta/:athleteId" element={<PublicAthletePage />} />
                    <Route path="/carnet/:athleteId" element={<AthleteCardPublic />} />
                    {/* Public check-in page — no auth required, opened from athlete QR code */}
                    <Route path="/checkin/:token" element={<Checkin />} />
                    {/* Protected training tools */}
                    <Route
                      path="/training/checkin"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                          <TrainingCheckin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/training/timer"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'coach', 'leader']}>
                          <TrainingTimer />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/knowledge-base"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'leader']}>
                          <KnowledgeBase />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/automatizaciones"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'leader']}>
                          <AutomationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agentes"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'leader']}>
                          <AgentsLive />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/oficina"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'leader']}>
                          <AgentOffice />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/superadmin"
                      element={
                        <SuperAdminRoute>
                          <SuperAdminDashboard />
                        </SuperAdminRoute>
                      }
                    />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
