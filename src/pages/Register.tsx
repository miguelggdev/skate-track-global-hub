import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useClubByDomain } from '@/hooks/useClubByDomain';
import { supabase } from '@/integrations/supabase/client';
import { User, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido').max(100).transform(v => v.trim()),
  lastName: z.string().min(1, 'Apellido requerido').max(100).transform(v => v.trim()),
  email: z.string().email('Email inválido').max(254).transform(v => v.trim().toLowerCase()),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[a-zA-Z]/, 'Debe contener al menos una letra')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { club, loading: clubLoading } = useClubByDomain();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse({ firstName, lastName, email, password, confirmPassword });
    if (!result.success) {
      toast({
        title: 'Datos inválidos',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (!club) {
      toast({
        title: 'Club no identificado',
        description: 'Este dominio no está habilitado para registro. Contacta al operador de la plataforma.',
        variant: 'destructive',
      });
      return;
    }

    const validated = result.data;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: {
            first_name: validated.firstName,
            last_name: validated.lastName,
            club_id: club.id,
            ...(isParent ? { role: 'parent' } : {}),
            ...(inviteToken ? { invite_token: inviteToken } : {}),
          },
        },
      });

      if (error) {
        toast({
          title: 'Error al crear cuenta',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setRegistered(true);

      if (data.session) {
        toast({
          title: '¡Bienvenido!',
          description: 'Tu cuenta fue creada. Redirigiendo al panel...',
        });
        navigate('/app', { replace: true });
      } else {
        setNeedsConfirmation(true);
      }
    } catch {
      toast({ title: 'Error inesperado', description: 'Por favor intenta nuevamente.', variant: 'destructive' });
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
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />

      <Card className="w-full max-w-md backdrop-blur-lg bg-black/40 shadow-2xl border-white/30 relative z-10 animate-scale-in">
        <CardHeader className="text-center space-y-1 pb-4">
          <div className="flex justify-center mb-2">
            {club?.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600/80 flex items-center justify-center border-2 border-white/30 shadow-lg">
                <span className="text-3xl">⛸️</span>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {registered && needsConfirmation ? '¡Cuenta creada!' : 'Crear cuenta'}
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm">
            {registered && needsConfirmation
              ? 'Revisa tu email para continuar'
              : club
              ? `Registro en ${club.name}`
              : inviteToken
              ? 'Registro del administrador del club'
              : 'Regístrate para continuar'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-6">
          {!clubLoading && !club ? (
            <div className="text-center space-y-3 py-6">
              <div className="flex justify-center">
                <AlertTriangle className="h-12 w-12 text-amber-400" />
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                Este dominio no está habilitado para registro todavía.
              </p>
              <p className="text-gray-400 text-xs">
                Contacta al operador de la plataforma si crees que esto es un error.
              </p>
            </div>
          ) : registered && needsConfirmation ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                Enviamos un enlace de confirmación a{' '}
                <span className="text-white font-semibold">{email}</span>.
                <br />
                Haz clic en el enlace para activar tu cuenta de administrador.
              </p>
              <p className="text-gray-400 text-xs">
                Revisa también tu carpeta de spam.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium mt-2"
              >
                Volver al login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-9 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-9 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña (mínimo 8 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/75 border-white/40 text-gray-900 placeholder:text-gray-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs">Las contraseñas no coinciden</p>
              )}

              {/* Role selector */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-white/10 border border-white/20 cursor-pointer hover:bg-white/15 transition-colors">
                <input
                  type="checkbox"
                  checked={isParent}
                  onChange={e => setIsParent(e.target.checked)}
                  className="mt-0.5 accent-blue-500 h-4 w-4 shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-white">Soy padre / tutor de un atleta</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    El administrador del club vinculará tu cuenta con el perfil de tu hijo/a.
                  </p>
                </div>
              </label>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading || clubLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando cuenta...</>
                ) : isParent ? 'Crear cuenta de padre/tutor' : 'Crear cuenta'}
              </Button>

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  ¿Ya tienes cuenta? Iniciar sesión
                </Link>
              </div>
            </form>
          )}

          <div className="text-center mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400">
              © 2026 SpeedSkate Academy - Todos los derechos reservados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
