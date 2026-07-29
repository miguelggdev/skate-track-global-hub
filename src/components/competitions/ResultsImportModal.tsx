import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Upload, FileImage, CheckCircle2, AlertCircle, Loader2, X, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedRow {
  posc: string;
  bib_number: string;
  final_time: string;
  semifinal_time: string;
  obs: string;
  nombre: string;
  apellido: string;
  categoria: string;
  rama: string;
  club: string;
  confirmed: boolean;
  matched_athlete_id?: string;
}

interface ResultsImportModalProps {
  competitionId: string;
  competitionName: string;
  onImported?: () => void;
}

const OBS_OPTIONS = ['', 'FS', 'DNS', 'DNF', 'DQ', 'EL'];
const RAMA_OPTIONS = ['Damas', 'Varones'];

export function ResultsImportModal({ competitionId, competitionName, onImported }: ResultsImportModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validMimes.includes(f.type)) {
      toast.error('Solo se aceptan archivos JPEG, PNG o PDF');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10 MB');
      return;
    }
    setFile(f);
  };

  const uploadAndExtract = async () => {
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Debes iniciar sesión para importar resultados');
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const path = `competition-results/${competitionId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: false });

      if (uploadErr) throw uploadErr;

      const fileType = file.type.includes('pdf') ? 'pdf' : 'image';

      const { data: importRecord, error: importErr } = await supabase
        .from('result_imports')
        .insert({
          competition_id: competitionId,
          file_url: path,
          file_type: fileType,
          file_name: file.name,
          status: 'pending',
          imported_by: session.user.id,
        })
        .select('id')
        .single();

      if (importErr) throw importErr;
      setImportId(importRecord.id);

      // Llamar Edge Function / LangGraph para OCR
      setExtracting(true);
      const { data: extracted, error: ocrErr } = await supabase.functions.invoke('extract-competition-results', {
        body: { import_id: importRecord.id, file_path: path, file_type: fileType },
      });

      if (ocrErr || !extracted?.rows) {
        // Si el OCR falla (Edge Function no disponible aún), entrar en modo manual
        setRows([emptyRow()]);
        toast.info('El OCR no está disponible. Ingresa los resultados manualmente.');
      } else {
        setRows((extracted.rows as ExtractedRow[]).map(r => ({ ...r, confirmed: false })));
        await supabase.from('result_imports').update({
          status: 'extracted',
          raw_extracted: extracted.rows,
          rows_total: extracted.rows.length,
        }).eq('id', importRecord.id);
      }

      setStep('review');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al procesar el archivo: ${msg}`);
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const parseTime = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const val = parseFloat(timeStr);
    if (!isFinite(val) || val <= 0 || val > 7200) return null;
    return val;
  };

  const emptyRow = (): ExtractedRow => ({
    posc: '', bib_number: '', final_time: '', semifinal_time: '',
    obs: '', nombre: '', apellido: '', categoria: '', rama: 'Varones', club: '', confirmed: false,
  });

  const updateRow = (index: number, field: keyof ExtractedRow, value: string | boolean) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));

  const confirmAll = () => setRows(prev => prev.map(r => ({ ...r, confirmed: true })));

  const saveResults = async () => {
    const toSave = rows.filter(r => r.confirmed && r.nombre);
    if (!toSave.length) {
      toast.error('Confirma al menos un resultado antes de guardar');
      return;
    }

    setSaving(true);
    try {
      const inserts = toSave.map(r => ({
        competition_id: competitionId,
        result_import_id: importId,
        position: r.posc ? parseInt(r.posc) : null,
        bib_number: r.bib_number || null,
        time_seconds: parseTime(r.final_time),
        time_ms: parseTime(r.final_time) !== null ? Math.round(parseTime(r.final_time)! * 1000) : null,
        notes: [r.obs, r.semifinal_time ? `SF:${r.semifinal_time}` : ''].filter(Boolean).join(' | ') || null,
        status: r.obs ? r.obs.toLowerCase() : 'normal',
        athlete_id: r.matched_athlete_id ?? null,
      }));

      const { error } = await supabase.from('competition_results').insert(inserts);
      if (error) throw error;

      if (importId) {
        await supabase.from('result_imports').update({
          status: 'imported',
          rows_imported: inserts.length,
          rows_skipped: rows.length - inserts.length,
          completed_at: new Date().toISOString(),
        }).eq('id', importId);
      }

      toast.success(`${inserts.length} resultados guardados correctamente`);
      setStep('done');
      onImported?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFile(null); setRows([]); setImportId(null);
    setStep('upload'); setUploading(false); setExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar Resultados
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" />
            Importar Resultados — {competitionName}
          </DialogTitle>
          <DialogDescription>
            Sube una imagen JPEG/PNG o PDF con los resultados. La IA extrae los datos automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Paso 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Arrastra aquí o haz clic para seleccionar</p>
              <p className="text-sm text-muted-foreground mt-1">JPEG, PNG o PDF — máx. 10 MB</p>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {(uploading || extracting) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? 'Subiendo archivo...' : 'Extrayendo datos con IA...'}
                </div>
                <Progress value={uploading ? 40 : 80} className="h-1.5" />
              </div>
            )}

            <DialogFooter>
              <Button onClick={uploadAndExtract} disabled={!file || uploading || extracting}>
                {uploading || extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? 'Subiendo...' : extracting ? 'Extrayendo...' : 'Procesar archivo'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Paso 2: Revisión */}
        {step === 'review' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Revisa y confirma cada fila antes de guardar
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setRows(prev => [...prev, emptyRow()])}>
                  + Fila
                </Button>
                <Button variant="secondary" size="sm" onClick={confirmAll}>
                  Confirmar todos
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-10">POSC</TableHead>
                    <TableHead className="w-12">NÚM</TableHead>
                    <TableHead className="w-24">FINAL (s)</TableHead>
                    <TableHead className="w-24">SF (s)</TableHead>
                    <TableHead className="w-16">OBS</TableHead>
                    <TableHead className="w-32">NOMBRE</TableHead>
                    <TableHead className="w-32">APELLIDO</TableHead>
                    <TableHead className="w-28">CATEGORÍA</TableHead>
                    <TableHead className="w-20">RAMA</TableHead>
                    <TableHead className="w-28">CLUB</TableHead>
                    <TableHead className="w-16">OK</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row.confirmed ? 'bg-emerald-500/5' : ''}>
                      <TableCell>
                        <Input className="h-7 w-14 text-xs" value={row.posc} onChange={e => updateRow(i, 'posc', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 w-14 text-xs" value={row.bib_number} onChange={e => updateRow(i, 'bib_number', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 w-24 text-xs font-mono" value={row.final_time} onChange={e => updateRow(i, 'final_time', e.target.value)} placeholder="10.866" />
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 w-24 text-xs font-mono" value={row.semifinal_time} onChange={e => updateRow(i, 'semifinal_time', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Select value={row.obs} onValueChange={v => updateRow(i, 'obs', v)}>
                          <SelectTrigger className="h-7 w-16 text-xs">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {OBS_OPTIONS.map(o => (
                              <SelectItem key={o || 'none'} value={o}>{o || '—'}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 text-xs" value={row.nombre} onChange={e => updateRow(i, 'nombre', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 text-xs" value={row.apellido} onChange={e => updateRow(i, 'apellido', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 text-xs" value={row.categoria} onChange={e => updateRow(i, 'categoria', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Select value={row.rama} onValueChange={v => updateRow(i, 'rama', v)}>
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RAMA_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 text-xs" value={row.club} onChange={e => updateRow(i, 'club', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => updateRow(i, 'confirmed', !row.confirmed)}
                          aria-label={row.confirmed ? 'Quitar confirmación' : 'Confirmar fila'}
                          aria-pressed={row.confirmed}
                          className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${row.confirmed ? 'bg-emerald-500 text-white' : 'bg-muted border border-border hover:border-emerald-500'}`}
                        >
                          {row.confirmed && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => removeRow(i)}
                          aria-label="Eliminar fila"
                          title="Eliminar fila"
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{rows.filter(r => r.confirmed).length} de {rows.length} confirmados</span>
              <span className="flex gap-2">
                <Badge variant="outline">{rows.filter(r => r.obs === 'DNS').length} DNS</Badge>
                <Badge variant="outline">{rows.filter(r => r.obs === 'DNF').length} DNF</Badge>
                <Badge variant="outline">{rows.filter(r => r.obs === 'DQ' || r.obs === 'FS').length} DQ/FS</Badge>
              </span>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={reset}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={saveResults} disabled={saving || !rows.some(r => r.confirmed)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Guardar {rows.filter(r => r.confirmed).length} resultados
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Paso 3: Listo */}
        {step === 'done' && (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-semibold">Resultados importados</h3>
            <p className="text-sm text-muted-foreground">
              Los resultados fueron guardados. Puedes asignar medallas desde el podio virtual.
            </p>
            <DialogFooter className="justify-center">
              <Button onClick={() => { setOpen(false); reset(); }}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
