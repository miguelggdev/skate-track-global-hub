import React, { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, PenLine } from 'lucide-react';
import { SignatureCanvas, type SignatureCanvasRef } from './SignatureCanvas';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
  title?: string;
  loading?: boolean;
}

export function SignaturePad({ open, onClose, onConfirm, title = 'Capturar firma', loading = false }: Props) {
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const [hasStrokes, setHasStrokes] = useState(false);

  const handleClear = () => {
    canvasRef.current?.clear();
    setHasStrokes(false);
  };

  const handleConfirm = () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return;
    onConfirm(canvasRef.current.toDataURL('image/png'));
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-orange-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Dibuja tu firma con el mouse o el dedo en el área de abajo.
          </p>

          <div className="relative">
            <SignatureCanvas
              ref={canvasRef}
              width={460}
              height={180}
              penWidth={2.5}
              onBegin={() => setHasStrokes(true)}
              className="bg-white"
            />
            {!hasStrokes && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground/50 select-none">Firma aquí</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-muted-foreground/20" />
            <span className="text-xs text-muted-foreground">área de firma</span>
            <div className="h-px flex-1 bg-muted-foreground/20" />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleClear} disabled={!hasStrokes}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Limpiar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={!hasStrokes || loading}>
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Confirmar firma
                </span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
