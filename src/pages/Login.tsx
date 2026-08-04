
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(254).transform(v => v.trim().toLowerCase()),
  password: z.string().min(1, 'Contraseña requerida').max(128),
});

const resetSchema = z.object({
  email: z.string().email('Email inválido').max(254).transform(v => v.trim().toLowerCase()),
});

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, user } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast({ title: 'Datos inválidos', description: result.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(result.data.email, result.data.password);

      if (error) {
        toast({
          title: t('login.error'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('login.welcome'),
        });
        navigate('/app', { replace: true });
      }
    } catch (e) {
      toast({ title: "Error inesperado", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = resetSchema.safeParse({ email: resetEmail });
    if (!result.success) {
      toast({ title: 'Email inválido', description: result.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(result.data.email);

      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('common.info'),
        });
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (e) {
      toast({ title: "Error inesperado", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
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
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      
      {/* Glassmorphism card */}
      <Card className="w-full max-w-md backdrop-blur-lg bg-black/40 shadow-2xl border-white/30 relative z-10 animate-scale-in">
        <CardHeader className="text-center space-y-1 pb-4">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-blue-600/80 flex items-center justify-center border-2 border-white/30 shadow-lg">
              <span className="text-3xl">⛸️</span>
            </div>
          </div>
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
                    placeholder={t('login.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('login.signing_in')}</>
                ) : t('login.submit')}
              </Button>
              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-300 hover:text-white p-0 h-auto"
                  onClick={() => setShowForgotPassword(true)}
                >
                  {t('login.forgot_password')}
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
                  placeholder={t('login.email')}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.loading')}</>
                ) : t('action.confirm')}
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
                  {t('action.back')}
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-center mt-4 pt-4 border-t border-white/10 space-y-2">
            <p className="text-xs text-gray-400">
              ¿Primer acceso?{' '}
              <Link to="/register" className="text-blue-300 hover:text-blue-200 underline transition-colors">
                Crear cuenta de administrador
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              © 2026 SpeedSkate Academy - Todos los derechos reservados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
