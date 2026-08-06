import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Nfc, Wifi, WifiOff, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNFC } from '@/hooks/useNFC';
import { cn } from '@/lib/utils';

interface NFCTagManagerProps {
  athleteId: string;
  athleteName: string;
  checkinToken: string | null;
}

interface TagStatus {
  nfc_tag_uid: string | null;
  checkin_token: string | null;
}

export function NFCTagManager({ athleteId, athleteName: _athleteName, checkinToken }: NFCTagManagerProps) {
  const APP_URL = window.location.origin;
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isSupported, status: nfcStatus, error: nfcError, readUID, writeURL, stopScan } = useNFC();
  const [action, setAction] = useState<'idle' | 'associating' | 'programming'>('idle');

  const { data: tagStatus, isLoading } = useQuery<TagStatus>({
    queryKey: ['athlete-nfc-tag', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('nfc_tag_uid, checkin_token')
        .eq('id', athleteId)
        .single();
      if (error) throw error;
      return data as TagStatus;
    },
  });

  const setTagMutation = useMutation({
    mutationFn: async (tagUid: string | null) => {
      const { data, error } = await supabase.rpc('set_athlete_nfc_tag', {
        p_athlete_id: athleteId,
        p_tag_uid: tagUid,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error ?? 'Error al guardar tag');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athlete-nfc-tag', athleteId] });
      qc.invalidateQueries({ queryKey: ['athletes'] });
    },
  });

  const handleAssociate = async () => {
    if (!isSupported) {
      toast({ title: 'NFC no disponible', description: 'Usa Chrome en Android con NFC activado.', variant: 'destructive' });
      return;
    }
    setAction('associating');
    toast({ title: 'Acerca el teléfono al tag del casco...', description: 'Esperando lectura NFC' });

    const uid = await readUID();
    setAction('idle');

    if (!uid) {
      toast({ title: 'Lectura cancelada o fallida', variant: 'destructive' });
      return;
    }

    try {
      await setTagMutation.mutateAsync(uid);
      toast({ title: `Tag asociado correctamente`, description: `UID: ${uid.slice(0, 14)}...` });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    }
  };

  const handleProgram = async () => {
    if (!isSupported) {
      toast({ title: 'NFC no disponible', description: 'Usa Chrome en Android con NFC activado.', variant: 'destructive' });
      return;
    }
    const token = tagStatus?.checkin_token ?? checkinToken;
    if (!token) {
      toast({ title: 'Sin token de check-in', variant: 'destructive' });
      return;
    }

    setAction('programming');
    const url = `${APP_URL}/checkin/${token}`;
    toast({ title: 'Acerca el teléfono al tag...', description: 'Grabando URL de check-in' });

    const ok = await writeURL(url);
    setAction('idle');

    if (ok) {
      toast({ title: 'Tag programado', description: `URL grabada: ${url}` });
    } else {
      toast({ title: nfcError ?? 'Error al programar el tag', variant: 'destructive' });
    }
  };

  const handleRemove = async () => {
    try {
      await setTagMutation.mutateAsync(null);
      toast({ title: 'Tag eliminado correctamente' });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    }
  };

  const isActive = nfcStatus === 'scanning' || nfcStatus === 'writing' || action !== 'idle';
  const hasTag = !!tagStatus?.nfc_tag_uid;
  const checkinURL = `${APP_URL}/checkin/${tagStatus?.checkin_token ?? checkinToken ?? ''}`;

  return (
    <div className="space-y-4">
      {/* NFC support warning */}
      {!isSupported && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Web NFC no disponible en este dispositivo. Usa Chrome en Android con NFC activado para asociar y programar tags.
          </p>
        </div>
      )}

      {/* Tag status card */}
      <Card className={cn('border-2', hasTag ? 'border-emerald-500/40' : 'border-dashed border-muted')}>
        <CardContent className="pt-5 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasTag ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Tag NFC asociado</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">
                UID: {tagStatus?.nfc_tag_uid}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Sin tag NFC asignado</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFC scanning pulse indicator */}
      {isActive && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Nfc className="h-8 w-8 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
          </div>
          <p className="text-sm font-medium text-center">
            {action === 'associating' ? 'Acerca el teléfono al tag del casco...' : 'Grabando URL en el tag...'}
          </p>
          <Button variant="ghost" size="sm" onClick={() => { stopScan(); setAction('idle'); }}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Actions */}
      {!isActive && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleAssociate}
            disabled={setTagMutation.isPending}
          >
            <Nfc className="h-4 w-4" />
            {hasTag ? 'Reasociar tag' : 'Asociar tag NFC'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleProgram}
            disabled={setTagMutation.isPending}
          >
            <Wifi className="h-4 w-4" />
            Programar tag (URL)
          </Button>

          {hasTag && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={setTagMutation.isPending}
            >
              {setTagMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />}
              Eliminar
            </Button>
          )}
        </div>
      )}

      {/* Check-in URL hint */}
      {(tagStatus?.checkin_token ?? checkinToken) && (
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-[11px] text-muted-foreground mb-0.5">URL de check-in (también grabada en el tag):</p>
          <p className="text-xs font-mono break-all text-foreground">{checkinURL}</p>
        </div>
      )}

      {nfcError && !isActive && (
        <p className="text-xs text-destructive">{nfcError}</p>
      )}
    </div>
  );
}
