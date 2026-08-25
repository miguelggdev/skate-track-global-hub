import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ShieldOff } from 'lucide-react';

/**
 * Pantalla de bloqueo cuando clubs.is_active = false (club suspendido por
 * retiro o falta de pago). Se muestra en vez de cualquier ruta protegida —
 * ver el chequeo en App.tsx (ProtectedRoute / RoleBasedRedirect).
 */
export const SuspendedAccountScreen = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cuenta Suspendida</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            El acceso de tu club a la plataforma está temporalmente suspendido.
            Contacta al equipo de soporte para más información.
          </p>
        </div>
        <Button variant="outline" onClick={() => signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};
