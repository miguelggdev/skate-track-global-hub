import { useState, useCallback, useRef } from 'react';

export type NFCStatus = 'idle' | 'scanning' | 'writing' | 'error' | 'unsupported';

export interface NFCReading {
  uid: string;
  url: string | null;
}

function extractURL(records: ReadonlyArray<NDEFRecord>): string | null {
  for (const record of records) {
    if (!record.data) continue;
    if (record.recordType === 'url') {
      return new TextDecoder().decode(record.data);
    }
    if (record.recordType === 'text') {
      const text = new TextDecoder(record.encoding ?? 'utf-8').decode(record.data);
      if (text.startsWith('http')) return text;
    }
  }
  return null;
}

export function useNFC() {
  const [status, setStatus] = useState<NFCStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  const startScan = useCallback(
    async (onReading: (r: NFCReading) => void): Promise<() => void> => {
      if (!isSupported) {
        setStatus('unsupported');
        setError('Web NFC no está disponible en este dispositivo. Usa Chrome en Android.');
        return () => {};
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('scanning');
      setError(null);

      try {
        const reader = new NDEFReader();
        await reader.scan({ signal: controller.signal });

        reader.addEventListener('reading', (evt: NDEFReadingEvent) => {
          onReading({ uid: evt.serialNumber, url: extractURL(evt.message.records) });
        });

        reader.addEventListener('readingerror', () => {
          setError('No se pudo leer el tag. Acerca el teléfono lentamente.');
        });

        return () => controller.abort();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setStatus('idle');
          return () => {};
        }
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Permiso NFC denegado. Activa NFC y acepta el permiso.'
            : err instanceof Error
            ? err.message
            : 'Error NFC desconocido';
        setStatus('error');
        setError(msg);
        return () => {};
      }
    },
    [isSupported]
  );

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setError(null);
  }, []);

  const writeURL = useCallback(
    async (url: string): Promise<boolean> => {
      if (!isSupported) {
        setError('Web NFC no disponible en este dispositivo');
        return false;
      }
      setStatus('writing');
      setError(null);
      try {
        const writer = new NDEFReader();
        await writer.write({ records: [{ recordType: 'url', data: url }] });
        setStatus('idle');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al escribir el tag';
        setStatus('error');
        setError(msg);
        return false;
      }
    },
    [isSupported]
  );

  const readUID = useCallback(async (): Promise<string | null> => {
    if (!isSupported) {
      setError('Web NFC no disponible');
      return null;
    }
    return new Promise((resolve) => {
      const controller = new AbortController();
      abortRef.current = controller;  // ← allow stopScan() to cancel readUID in flight
      setStatus('scanning');
      setError(null);

      const reader = new NDEFReader();
      reader
        .scan({ signal: controller.signal })
        .then(() => {
          reader.addEventListener(
            'reading',
            (evt: NDEFReadingEvent) => {
              controller.abort();
              setStatus('idle');
              resolve(evt.serialNumber);
            },
            { once: true }
          );
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') {
            resolve(null);
          } else {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Error NFC');
            resolve(null);
          }
        });
    });
  }, [isSupported]);

  return { isSupported, status, error, startScan, stopScan, writeURL, readUID };
}
