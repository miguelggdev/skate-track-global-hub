import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  PenLine, CheckCircle2, Download, Clock, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { SignatureCanvas } from './SignatureCanvas';

interface Signature {
  id: string;
  signer_name: string;
  signer_role: string | null;
  signature_data: string;
  signed_at: string;
}

const schema = z.object({
  signer_name: z.string().min(2, 'Nombre requerido (mínimo 2 caracteres)'),
});
type FormValues = z.infer<typeof schema>;

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  documentTitle: string;
  documentId?: string;
}

export function DocumentSignatureDialog({ open, onClose, documentTitle, documentId }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const qc = useQueryClient();
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  const queryKey = ['document-signatures', documentId ?? documentTitle];

  const { data: existingSignatures = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      const query = supabase.from('document_signatures').select('*').order('signed_at');
      const result = documentId
        ? await query.eq('document_id', documentId)
        : await query.eq('document_title', documentTitle);
      return (result.data ?? []) as Signature[];
    },
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { signer_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : '' },
  });

  React.useEffect(() => {
    if (profile) {
      reset({ signer_name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() });
    }
  }, [profile, reset]);

  const signMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!signatureData) throw new Error('Firma requerida');
      const { error } = await supabase.from('document_signatures').insert({
        document_id:    documentId ?? null,
        document_title: documentTitle,
        signer_user_id: user?.id ?? null,
        signer_name:    values.signer_name,
        signer_role:    profile?.role ?? null,
        signature_data: signatureData,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast({ title: 'Documento firmado correctamente' });
      setSigned(true);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Error al firmar';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const downloadSignedConfirmation = () => {
    const myName = (document.getElementById('signer-name-display') as HTMLElement)?.textContent ?? 'Firmante';
    const text = [
      `CONSTANCIA DE FIRMA DIGITAL`,
      ``,
      `Documento: ${documentTitle}`,
      `Firmado por: myName`,
      `Fecha: ${new Date().toLocaleString('es-CO')}`,
      ``,
      `Firmas registradas:`,
      ...existingSignatures.map(s =>
        `  - ${s.signer_name}${s.signer_role ? ` (${s.signer_role})` : ''} — ${formatDateTime(s.signed_at)}`
      ),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firma_${documentTitle.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setSigned(false);
    setSignatureData(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-violet-500" />
            Firma digital
          </DialogTitle>
          <DialogDescription className="truncate">
            {documentTitle}
          </DialogDescription>
        </DialogHeader>

        {signed ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">¡Documento firmado!</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tu firma ha sido registrada correctamente
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadSignedConfirmation}>
                <Download className="h-4 w-4 mr-1.5" /> Descargar constancia
              </Button>
              <Button size="sm" onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(v => signMutation.mutate(v))} className="space-y-5">
            {/* Existing signatures */}
            {existingSignatures.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Firmas anteriores ({existingSignatures.length})
                </p>
                <div className="space-y-2">
                  {existingSignatures.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="w-9 h-9 rounded-md border border-border bg-white overflow-hidden flex-shrink-0">
                        <img src={s.signature_data} alt={s.signer_name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.signer_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(s.signed_at)}
                          {s.signer_role && (
                            <Badge variant="secondary" className="text-[10px] ml-1">{s.signer_role}</Badge>
                          )}
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Signer name */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Tu nombre completo *
              </Label>
              <Input
                id="signer-name-display"
                placeholder="Nombre como aparecerá en la firma"
                {...register('signer_name')}
              />
              {errors.signer_name && (
                <p className="text-xs text-red-500">{errors.signer_name.message}</p>
              )}
            </div>

            {/* Canvas */}
            <div className="space-y-1.5">
              <Label>Firma *</Label>
              <SignatureCanvas onSignatureChange={setSignatureData} height={160} />
              {!signatureData && isSubmitting && (
                <p className="text-xs text-red-500">Dibuja tu firma antes de continuar</p>
              )}
            </div>

            <div className={cn(
              'text-xs text-muted-foreground p-3 rounded-lg bg-muted/40 border border-border',
            )}>
              Al hacer clic en "Firmar documento" confirmas que eres {profile?.first_name ?? 'el firmante indicado'}
              y aceptas que esta firma digital tiene validez dentro del sistema SpeedSkateTrack Hub.
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                type="submit"
                disabled={isSubmitting || !signatureData}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <PenLine className="h-4 w-4 mr-1.5" />
                {isSubmitting ? 'Firmando…' : 'Firmar documento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
