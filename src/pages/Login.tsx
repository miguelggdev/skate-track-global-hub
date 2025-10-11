
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login exitoso",
        description: "Has iniciado sesión correctamente",
      });
      navigate('/');
    }
    setIsLoading(false);
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(resetEmail);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado",
        description: "Revisa tu email para las instrucciones de recuperación de contraseña",
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
    setIsLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ 
        backgroundImage: 'url(/images/login-bg.png)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
    >
      {/* Dark overlay with subtle blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      {/* Glassmorphism card */}
      <Card className="w-full max-w-md backdrop-blur-xl bg-black/60 shadow-2xl border-white/20 relative z-10 animate-scale-in">
        <CardHeader className="text-center space-y-1 pb-4">
          <CardTitle className="text-3xl font-bold text-white">
            SpeedSkate Academy
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm">
            Sistema de Gestión Deportiva
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-6">
          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ingrese su usuario"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-300 hover:text-white p-0 h-auto"
                  onClick={() => setShowForgotPassword(true)}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Ingrese su email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar instrucciones"}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-300 hover:text-white p-0 h-auto"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                >
                  Volver al login
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-center mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400">
              © 2025 SpeedSkate Academy - Todos los derechos reservados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
