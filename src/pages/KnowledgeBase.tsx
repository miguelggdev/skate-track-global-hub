import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, Loader2, BookOpen, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

const DOC_TYPES = [
  { value: 'reglamento', label: 'Reglamento' },
  { value: 'resolucion', label: 'Resolución' },
  { value: 'manual', label: 'Manual' },
  { value: 'planilla', label: 'Planilla' },
  { value: 'otro', label: 'Otro' },
] as const;

type DocType = typeof DOC_TYPES[number]['value'];

interface KnowledgeDoc {
  id: string;
  title: string;
  document_type: string;
  filename: string;
  chunks_count: number;
  indexed_at: string | null;
  created_at: string;
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? `Bearer ${session.access_token}` : '';
}

async function fetchDocuments(): Promise<KnowledgeDoc[]> {
  const auth = await getAuthHeader();
  const res = await fetch(`${BACKEND_URL}/api/rag/documents`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) throw new Error('Error al cargar documentos');
  const data = await res.json();
  return data.documents as KnowledgeDoc[];
}

const TYPE_COLORS: Record<string, string> = {
  reglamento: 'bg-blue-500/10 text-blue-600 border-blue-200',
  resolucion: 'bg-violet-500/10 text-violet-600 border-violet-200',
  manual:     'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  planilla:   'bg-amber-500/10 text-amber-600 border-amber-200',
  otro:       'bg-gray-500/10 text-gray-600 border-gray-200',
};

export default function KnowledgeBase() {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocType>('otro');
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['knowledge-documents'],
    queryFn: fetchDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !title.trim()) throw new Error('Completa los campos');
      const auth = await getAuthHeader();
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('title', title.trim());
      form.append('document_type', docType);

      setUploadProgress('Subiendo archivo...');
      const res = await fetch(`${BACKEND_URL}/api/rag/upload`, {
        method: 'POST',
        headers: { Authorization: auth },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setUploadProgress(null);
      toast({
        title: 'Documento indexado',
        description: `${data.chunks_indexed} fragmentos listos para RAG${data.chunks_failed ? ` (${data.chunks_failed} fallaron)` : ''}`,
      });
      setSelectedFile(null);
      setTitle('');
      setDocType('otro');
      if (fileInputRef.current) fileInputRef.current.value = '';
      qc.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
    onError: (err: Error) => {
      setUploadProgress(null);
      toast({ title: 'Error al subir', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const auth = await getAuthHeader();
      const res = await fetch(`${BACKEND_URL}/api/rag/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: auth },
      });
      if (!res.ok) throw new Error('Error al eliminar');
      return docId;
    },
    onSuccess: () => {
      setDeleteConfirm(null);
      toast({ title: 'Documento eliminado' });
      qc.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

  function handleFileSelect(file: File) {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.md')) {
      toast({ title: 'Tipo no permitido', description: 'Solo PDF, TXT o Markdown', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Archivo demasiado grande', description: 'Máximo 10 MB', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const isUploading = uploadMutation.isPending;

  return (
    <DashboardLayout title="Base de Conocimiento IA" userRole={profile?.role ?? 'admin'}>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Base de Conocimiento</h1>
            <p className="text-sm text-muted-foreground">
              Documentos indexados que los agentes IA usan para responder consultas
            </p>
          </div>
        </div>

        {/* Upload card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir nuevo documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              className={cn(
                'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-border hover:border-violet-400 hover:bg-accent/40',
                selectedFile && 'border-emerald-500 bg-emerald-500/5',
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFileSelect(f);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(0)} KB — listo para subir
                    </p>
                  </div>
                  <button
                    className="ml-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setTitle(''); }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Arrastra un archivo o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground">PDF, TXT o Markdown — máximo 10 MB</p>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</label>
                <Input
                  placeholder="Ej: Reglamento FCP 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</label>
                <Select value={docType} onValueChange={(v) => setDocType(v as DocType)} disabled={isUploading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress / submit */}
            {uploadProgress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress}
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedFile || !title.trim() || isUploading}
              onClick={() => uploadMutation.mutate()}
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Indexando...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Indexar documento</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Document list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos indexados
              </span>
              <Badge variant="secondary">{docs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No hay documentos indexados aún</p>
                <p className="text-xs text-muted-foreground">Sube el primer documento para que los agentes puedan consultarlo</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] capitalize', TYPE_COLORS[doc.document_type] ?? TYPE_COLORS.otro)}
                        >
                          {doc.document_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{doc.filename}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {doc.chunks_count} fragmentos
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>

                    {deleteConfirm === doc.id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-destructive font-medium">¿Eliminar?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2 text-xs"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(doc.id)}
                        >
                          {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sí'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/8 flex-shrink-0"
                        onClick={() => setDeleteConfirm(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4">
          <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-medium">¿Cómo funciona?</p>
            <p>Cada documento se divide en fragmentos de ~1000 caracteres y se convierten en vectores semánticos. Los agentes IA buscan en estos vectores para responder preguntas con contexto específico del club.</p>
            <p>Requiere <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">OPENAI_API_KEY</code> configurada en el servidor.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
