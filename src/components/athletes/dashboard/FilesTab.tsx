import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { useToast } from '@/hooks/use-toast';

const BUCKET = 'athlete-documents';

const DOCUMENT_TYPES = [
  { key: 'documento_identidad', label: 'Copia de Documento' },
  { key: 'carnet_eps', label: 'Carnet EPS' },
  { key: 'carnet_liga', label: 'Carnet de Liga' },
  { key: 'carnet_federacion', label: 'Carnet Federación' },
  { key: 'poliza_accidentes', label: 'Póliza de Accidentes' },
  { key: 'autorizacion_datos', label: 'Autorización de Datos' },
] as const;

type DocKey = typeof DOCUMENT_TYPES[number]['key'];

interface FileStatus {
  exists: boolean;
  fileName: string | null;
  uploading: boolean;
  downloading: boolean;
  deleting: boolean;
}

type FileStatuses = Record<DocKey, FileStatus>;

const DEFAULT_STATUS: FileStatus = {
  exists: false,
  fileName: null,
  uploading: false,
  downloading: false,
  deleting: false,
};

export const FilesTab = () => {
  const { athlete } = useCurrentAthlete();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<FileStatuses>(() =>
    Object.fromEntries(DOCUMENT_TYPES.map(d => [d.key, { ...DEFAULT_STATUS }])) as FileStatuses
  );
  const [loadingList, setLoadingList] = useState(true);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!athlete?.id) return;
    loadFileList(athlete.id);
  }, [athlete?.id]);

  const loadFileList = async (athleteId: string) => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(athleteId, { sortBy: { column: 'name', order: 'asc' } });

      if (error) throw error;

      const existingFiles = new Map(
        (data ?? []).map(f => {
          const key = f.name.split('.')[0] as DocKey;
          return [key, f.name];
        })
      );

      setStatuses(prev => {
        const next = { ...prev };
        DOCUMENT_TYPES.forEach(({ key }) => {
          const fileName = existingFiles.get(key) ?? null;
          next[key] = { ...next[key], exists: !!fileName, fileName };
        });
        return next;
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la lista de documentos', variant: 'destructive' });
    } finally {
      setLoadingList(false);
    }
  };

  const setProp = (key: DocKey, prop: Partial<FileStatus>) => {
    setStatuses(prev => ({ ...prev, [key]: { ...prev[key], ...prop } }));
  };

  const handleUpload = async (key: DocKey, file: File) => {
    if (!athlete?.id) return;
    const ext = file.name.split('.').pop() ?? 'pdf';
    const path = `${athlete.id}/${key}.${ext}`;
    setProp(key, { uploading: true });
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) throw error;
      await loadFileList(athlete.id);
      toast({ title: 'Documento subido', description: `${DOCUMENT_TYPES.find(d => d.key === key)?.label} guardado correctamente` });
    } catch (e) {
      toast({ title: 'Error al subir', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
      setProp(key, { uploading: false });
    }
  };

  const handleDownload = async (key: DocKey) => {
    if (!athlete?.id || !statuses[key].fileName) return;
    const path = `${athlete.id}/${statuses[key].fileName}`;
    setProp(key, { downloading: true });
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (e) {
      toast({ title: 'Error al descargar', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setProp(key, { downloading: false });
    }
  };

  const handleDelete = async (key: DocKey) => {
    if (!athlete?.id || !statuses[key].fileName) return;
    const path = `${athlete.id}/${statuses[key].fileName}`;
    setProp(key, { deleting: true });
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      setProp(key, { exists: false, fileName: null, deleting: false });
      toast({ title: 'Documento eliminado' });
    } catch (e) {
      toast({ title: 'Error al eliminar', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
      setProp(key, { deleting: false });
    }
  };

  if (!athlete) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Cargando información del deportista...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Mis Documentos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sube y descarga tus documentos deportivos. Formatos aceptados: PDF, JPG, PNG.
        </p>
      </CardHeader>
      <CardContent>
        {loadingList ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENT_TYPES.map(({ key, label }) => {
              const status = statuses[key];
              const busy = status.uploading || status.downloading || status.deleting;
              return (
                <div
                  key={key}
                  className="border rounded-lg p-4 space-y-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight">{label}</h4>
                    {status.exists ? (
                      <Badge variant="secondary" className="shrink-0 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Subido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
                        Pendiente
                      </Badge>
                    )}
                  </div>

                  {status.exists && status.fileName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {status.fileName}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <input
                      ref={el => { inputRefs.current[key] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(key, file);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => inputRefs.current[key]?.click()}
                    >
                      {status.uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {status.exists ? 'Reemplazar' : 'Subir'}
                    </Button>

                    {status.exists && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => handleDownload(key)}
                        >
                          {status.downloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Ver / Descargar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={busy}
                          onClick={() => handleDelete(key)}
                        >
                          {status.deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
