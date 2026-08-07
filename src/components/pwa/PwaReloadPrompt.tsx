import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

/**
 * Gestiona el ciclo de vida del service worker (vite-plugin-pwa).
 * - Avisa cuando la app queda lista para usarse sin conexión.
 * - Cuando hay una nueva versión, muestra un aviso persistente con acción
 *   "Actualizar" en lugar de recargar automáticamente (evita interrumpir
 *   formularios a medio llenar). No renderiza nada por sí mismo.
 */
export function PwaReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('App lista para usarse sin conexión', { duration: 4000 });
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    toast('Nueva versión disponible', {
      description: 'Actualiza para obtener las últimas mejoras.',
      duration: Infinity,
      action: {
        label: 'Actualizar',
        onClick: () => updateServiceWorker(true),
      },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
