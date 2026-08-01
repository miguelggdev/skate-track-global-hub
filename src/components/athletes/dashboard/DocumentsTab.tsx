import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText, Upload, Eye, AlertTriangle, CheckCircle,
  Clock, XCircle, Plus, Loader2, PenLine, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { SignaturePad } from '@/components/signature/SignaturePad';

const DOCUMENT_TYPES = [
  { value: 'documento_identidad', label: 'Documento de Identidad (TI/CC/Pasaporte)' },
  { value: 'tarjeta_eps', label: 'Carné EPS' },
  { value: 'registro_civil', label: 'Registro Civil' },
  { value: 'licencia_fedepatin', label: 'Licencia Fedepatin' },
  { value: 'certificado_medico_deportivo', label: 'Certificado Médico Deportivo' },
  { value: 'consentimiento_imagen', label: 'Consentimiento de Imagen' },
  { value: 'medical', label: 'Documento Médico' },
  { value: 'contract', label: 'Contrato / Autorización' },
  { value: 'other', label: 'Otro' },
];

interface Doc {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string | null;
  file_size_kb: number | null;
  expiry_date: string | null;
  doc_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const getStatusBadge = (doc: Doc) => {
  const now = new Date();
  const expiry = doc.expiry_date ? new Date(doc.expiry_date) : null;
  const daysUntilExpiry = expiry ? differenceInDays(expiry, now) : null;

  if (doc.doc_status === 'no_aplica') {
    return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />No aplica</Badge>;
  }
  if (!expiry || daysUntilExpiry === null) {
    return <Badge className="gap-1 bg-green-500/20 text-green-700 border-green-400"><CheckCircle className="h-3 w-3" />Vigente</Badge>;
  }
  if (daysUntilExpiry < 0) {
    return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Vencido</Badge>;
  }
  if (daysUntilExpiry <= 30) {
    return <Badge className="gap-1 bg-yellow-500/20 text-yellow-700 border-yellow-400"><Clock className="h-3 w-3" />Vence en {daysUntilExpiry}d</Badge>;
  }
  return <Badge className="gap-1 bg-green-500/20 text-green-700 border-green-400"><CheckCircle className="h-3 w-3" />Vigente</Badge>;
};

const getDocTypeLabel = (type: string) =>
  DOCUMENT_TYPES.find(d => d.value === type)?.label ?? type;

export const DocumentsTab = () => {
  const { athlete } = useCurrentAthlete();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [signaturePadOpen, setSignaturePadOpen] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['athlete-documents', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Doc[];
    },
    enabled: !!athlete?.id,
  });

  const { data: storedSignature } = useQuery({
    queryKey: ['athlete-signature', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return null;
      const { data } = await supabase
        .from('documents')
        .select('id, file_url, updated_at')
        .eq('athlete_id', athlete.id)
        .eq('document_type', 'firma_digital')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!athlete?.id,
  });

  const handleSaveSignature = async (dataUrl: string) => {
    if (!athlete?.id || !user?.id) return;
    setSavingSignature(true);
    try {
      // Convert base64 data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'firma.png', { type: 'image/png' });
      const path = `${user.id}/firma_digital/${athlete.id}_${Date.now()}.png`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: false });
      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);

      if (storedSignature?.id) {
        await supabase.from('documents').update({
          file_url: publicUrl,
          updated_at: new Date().toISOString(),
        }).eq('id', storedSignature.id);
      } else {
        await supabase.from('documents').insert({
          athlete_id: athlete.id,
          document_type: 'firma_digital',
          title: 'Firma Digital',
          file_url: publicUrl,
          file_name: 'firma_digital.png',
          file_size_kb: Math.round(file.size / 1024),
          doc_status: 'vigente',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['athlete-signature', athlete.id] });
      queryClient.invalidateQueries({ queryKey: ['athlete-documents', athlete.id] });
      toast({ title: 'Firma guardada correctamente' });
      setSignaturePadOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al guardar firma', description: err.message, variant: 'destructive' });
    } finally {
      setSavingSignature(false);
    }
  };

  const expiredCount = documents.filter(d => {
    const expiry = d.expiry_date ? new Date(d.expiry_date) : null;
    return expiry && differenceInDays(expiry, new Date()) < 0;
  }).length;

  const soonCount = documents.filter(d => {
    const expiry = d.expiry_date ? new Date(d.expiry_date) : null;
    const days = expiry ? differenceInDays(expiry, new Date()) : null;
    return days !== null && days >= 0 && days <= 30;
  }).length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Archivo muy grande', description: 'Máximo 10 MB por documento.', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !docType || !athlete?.id || !user?.id) return;
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop();
      const path = `${user.id}/${docType}/${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(path, selectedFile, { upsert: false });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);

      const { error: dbError } = await supabase.from('documents').insert({
        athlete_id: athlete.id,
        document_type: docType,
        title: selectedFile.name,
        file_url: publicUrl,
        file_name: selectedFile.name,
        file_size_kb: Math.round(selectedFile.size / 1024),
        expiry_date: expiryDate || null,
        doc_status: 'vigente',
      });

      if (dbError) throw dbError;

      toast({ title: 'Documento subido', description: `${selectedFile.name} cargado correctamente.` });
      queryClient.invalidateQueries({ queryKey: ['athlete-documents', athlete.id] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocType('');
      setExpiryDate('');
    } catch (err: any) {
      toast({ title: 'Error al subir', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (doc: Doc) => {
    window.open(doc.file_url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* ── Firma digital ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="h-4 w-4 text-orange-500" />
              Firma Digital
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setSignaturePadOpen(true)}
            >
              {storedSignature ? (
                <><RefreshCw className="h-3.5 w-3.5" />Actualizar firma</>
              ) : (
                <><PenLine className="h-3.5 w-3.5" />Capturar firma</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {storedSignature ? (
            <div className="flex flex-col items-start gap-2">
              <img
                src={storedSignature.file_url}
                alt="Firma digital"
                className="h-24 max-w-xs rounded border border-border bg-white object-contain p-2"
              />
              <p className="text-xs text-muted-foreground">
                Última actualización: {format(new Date(storedSignature.updated_at ?? ''), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
              <p className="text-xs text-muted-foreground/60">
                Esta firma se incluirá automáticamente en las cartas de permiso generadas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <PenLine className="h-10 w-10 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">Sin firma registrada</p>
              <p className="text-xs text-muted-foreground/60">
                Captura una firma para agregarla automáticamente a los documentos generados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {(expiredCount > 0 || soonCount > 0) && (
        <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            {expiredCount > 0 && <span className="font-semibold">{expiredCount} documento(s) vencido(s). </span>}
            {soonCount > 0 && <span>{soonCount} documento(s) vence(n) en menos de 30 días.</span>}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos del Deportista
            </CardTitle>
            <Button onClick={() => setUploadDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay documentos cargados</p>
              <p className="text-xs mt-1">Sube tus documentos para mantener tu carpeta al día</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {doc.file_name || getDocTypeLabel(doc.document_type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getDocTypeLabel(doc.document_type)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {getStatusBadge(doc)}
                        {doc.expiry_date && (
                          <span className="text-xs text-muted-foreground">
                            Vence: {format(new Date(doc.expiry_date), 'dd/MM/yyyy')}
                          </span>
                        )}
                        {doc.file_size_kb && (
                          <span className="text-xs text-muted-foreground">
                            {doc.file_size_kb < 1024
                              ? `${doc.file_size_kb} KB`
                              : `${(doc.file_size_kb / 1024).toFixed(1)} MB`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Ver / Descargar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Pad */}
      <SignaturePad
        open={signaturePadOpen}
        onClose={() => setSignaturePadOpen(false)}
        onConfirm={handleSaveSignature}
        loading={savingSignature}
        title="Capturar firma digital"
      />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Documento *</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Archivo * (PDF, JPG, PNG — máx. 10 MB)</Label>
              <div
                className="mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-muted-foreground">
                      ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Haz clic para seleccionar</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
              />
            </div>

            <div>
              <Label>Fecha de Vencimiento (opcional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !docType || uploading}
              className="gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Subiendo...' : 'Subir Documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
