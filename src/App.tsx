
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import AthleteDashboard from "./pages/AthleteDashboard";
import NotFound from "./pages/NotFound";
import DelegateDashboard from "./pages/DelegateDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import LeaderDashboard from "./pages/LeaderDashboard";

const queryClient = new QueryClient();

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const userRole = localStorage.getItem('userRole');
  
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['entrenador']}>
                <CoachDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/athlete-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['deportista']}>
                <AthleteDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delegate-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['delegado']}>
                <DelegateDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['gestor_financiero']}>
                <FinanceDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leader-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['lider']}>
                <LeaderDashboard />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
