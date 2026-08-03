import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string) => string;
}

interface Props {
  width?: number;
  height?: number;
  className?: string;
  penColor?: string;
  penWidth?: number;
  onBegin?: () => void;
  onChange?: () => void;
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, Props>(
  ({ width = 500, height = 200, className, penColor = '#1e1e1e', penWidth = 2, onBegin, onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const hasStrokes = useRef(false);

    const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

    const fillBackground = useCallback(() => {
      const ctx = getCtx();
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    useEffect(() => {
      fillBackground();
    }, [fillBackground]);

    const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = 'clientX' in e ? e.clientX : (e as Touch).clientX;
      const clientY = 'clientY' in e ? e.clientY : (e as Touch).clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDraw = useCallback((x: number, y: number) => {
      const ctx = getCtx();
      if (!ctx) return;
      isDrawing.current = true;
      lastPos.current = { x, y };
      if (!hasStrokes.current) {
        onBegin?.();
        hasStrokes.current = true;
      }
      ctx.beginPath();
      ctx.arc(x, y, penWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = penColor;
      ctx.fill();
    }, [penColor, penWidth, onBegin]);

    const draw = useCallback((x: number, y: number) => {
      if (!isDrawing.current) return;
      const ctx = getCtx();
      if (!ctx || !lastPos.current) return;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = { x, y };
      onChange?.();
    }, [penColor, penWidth, onChange]);

    const stopDraw = useCallback(() => {
      isDrawing.current = false;
      lastPos.current = null;
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const onMouseDown = (e: MouseEvent) => {
        const pos = getPos(e, canvas);
        startDraw(pos.x, pos.y);
      };
      const onMouseMove = (e: MouseEvent) => {
        const pos = getPos(e, canvas);
        draw(pos.x, pos.y);
      };
      const onMouseUp = () => stopDraw();

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const pos = getPos(e.touches[0], canvas);
        startDraw(pos.x, pos.y);
      };
      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const pos = getPos(e.touches[0], canvas);
        draw(pos.x, pos.y);
      };
      const onTouchEnd = () => stopDraw();

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mouseleave', onMouseUp);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd);

      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseUp);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      };
    }, [startDraw, draw, stopDraw]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        hasStrokes.current = false;
        fillBackground();
      },
      isEmpty: () => !hasStrokes.current,
      toDataURL: (type = 'image/png') => canvasRef.current?.toDataURL(type) ?? '',
    }), [fillBackground]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn('touch-none cursor-crosshair rounded-md border border-input w-full', className)}
        style={{ touchAction: 'none' }}
      />
    );
  },
);

SignatureCanvas.displayName = 'SignatureCanvas';
