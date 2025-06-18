
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulación de login - aquí se conectaría con Supabase
    setTimeout(() => {
      if (email && password && role) {
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
        
        toast({
          title: "Login exitoso",
          description: `Bienvenido como ${role}`,
        });

        // Rediriger según el rol
        switch (role) {
          case 'administrador':
            navigate('/admin-dashboard');
            break;
          case 'entrenador':
            navigate('/coach-dashboard');
            break;
          case 'deportista':
            navigate('/athlete-dashboard');
            break;
          case 'delegado':
            navigate('/delegate-dashboard');
            break;
          case 'gestor_financiero':
            navigate('/finance-dashboard');
            break;
          case 'lider':
            navigate('/leader-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">SpeedSkate Academy</CardTitle>
          <CardDescription>
            Sistema de Gestión Deportiva
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="entrenador">Entrenador</SelectItem>
                  <SelectItem value="deportista">Deportista</SelectItem>
                  <SelectItem value="delegado">Delegado (Padre/Madre)</SelectItem>
                  <SelectItem value="gestor_financiero">Gestor Financiero</SelectItem>
                  <SelectItem value="lider">Líder/Coordinador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
