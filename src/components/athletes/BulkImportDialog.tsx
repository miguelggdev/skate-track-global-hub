import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, Download, CheckCircle2, XCircle, AlertTriangle,
  FileSpreadsheet, ChevronRight, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'escuela', 'menores', 'transicion', 'prejuvenil',
  'juvenil', 'mayores', 'preclub', 'adultos',
] as const;

const VALID_GENDERS = ['masculino', 'femenino'] as const;

const CHUNK_SIZE = 50;

// ─── Zod schema ───────────────────────────────────────────────────────────────

const rowSchema = z.object({
  first_name:             z.string().min(1, 'Nombre requerido'),
  last_name:              z.string().min(1, 'Apellido requerido'),
  identification_number:  z.string().optional(),
  identification_type:    z.string().optional(),
  date_of_birth:          z.string().optional(),
  gender:                 z.enum(VALID_GENDERS, {
    errorMap: () => ({ message: `Género debe ser: ${VALID_GENDERS.join(' | ')}` }),
  }).optional(),
  category:               z.enum(VALID_CATEGORIES, {
    errorMap: () => ({ message: `Categoría inválida. Opciones: ${VALID_CATEGORIES.join(', ')}` }),
  }).default('escuela'),
  email:                  z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  personal_phone:         z.string().optional(),
  city:                   z.string().optional(),
  eps:                    z.string().optional(),
  guardian_name:          z.string().optional(),
  guardian_phone:         z.string().optional(),
});

type ValidRow = z.infer<typeof rowSchema>;

// ─── Header normalization ──────────────────────────────────────────────────────

function normalize(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

const HEADER_MAP: Record<string, string> = {
  nombres: 'first_name',     nombre: 'first_name',     primer_nombre: 'first_name',
  apellidos: 'last_name',    apellido: 'last_name',
  identificacion: 'identification_number', cedula: 'identification_number',
  documento: 'identification_number',      numero_id: 'identification_number',
  tipo_id: 'identification_type',          tipo_identificacion: 'identification_type',
  fecha_nacimiento: 'date_of_birth',       nacimiento: 'date_of_birth',
  genero: 'gender',          sexo: 'gender',
  categoria: 'category',
  email: 'email',            correo: 'email',           correo_electronico: 'email',
  telefono: 'personal_phone', celular: 'personal_phone', movil: 'personal_phone',
  ciudad: 'city',
  eps: 'eps',
  acudiente: 'guardian_name', nombre_acudiente: 'guardian_name',
  telefono_acudiente: 'guardian_phone', celular_acudiente: 'guardian_phone',
};

function mapHeaders(rawRow: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rawRow)) {
    const norm = normalize(key);
    const mapped_key = HEADER_MAP[norm] ?? norm;
    mapped[mapped_key] = val;
  }
  return mapped;
}

// ─── Value normalizers ────────────────────────────────────────────────────────

function normalizeGender(v: unknown): string | undefined {
  if (!v) return undefined;
  const s = normalize(String(v));
  if (['m', 'masculino', 'hombre', 'male'].includes(s)) return 'masculino';
  if (['f', 'femenino', 'mujer', 'female'].includes(s)) return 'femenino';
  return String(v);
}

function normalizeCategory(v: unknown): string | undefined {
  if (!v) return undefined;
  const s = normalize(String(v));
  const exact = VALID_CATEGORIES.find(c => c === s);
  if (exact) return exact;
  if (s.startsWith('esc') && !s.includes('men')) return 'escuela';
  if (s.startsWith('men'))   return 'menores';
  if (s.startsWith('trans')) return 'transicion';
  if (s.startsWith('pre') && s.includes('juv')) return 'prejuvenil';
  if (s.startsWith('juv'))   return 'juvenil';
  if (s.startsWith('may'))   return 'mayores';
  if (s.startsWith('prec'))  return 'preclub';
  if (s.startsWith('adu'))   return 'adultos';
  return String(v);
}

function parseDate(v: unknown): string | undefined {
  if (!v) return undefined;
  // Excel serial number
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  const s = String(v).trim();
  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s || undefined;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewRow {
  _row: number;
  raw: Record<string, unknown>;
  data?: ValidRow;
  errors?: string[];
  valid: boolean;
}

// ─── Template download ────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = [
    'nombres', 'apellidos', 'identificacion', 'tipo_id',
    'fecha_nacimiento', 'genero', 'categoria',
    'email', 'telefono', 'ciudad', 'eps',
    'acudiente', 'telefono_acudiente',
  ];
  const sample = [
    'Juan', 'Pérez', '1234567890', 'CC',
    '2010-05-20', 'masculino', 'juvenil',
    'juan@mail.com', '3001234567', 'Bogotá', 'Sura',
    'María Pérez', '3009876543',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Atletas');
  XLSX.writeFile(wb, 'plantilla_importacion_atletas.xlsx');
}

// ─── Parse file ───────────────────────────────────────────────────────────────

function parseFile(file: File): Promise<PreviewRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        const preview: PreviewRow[] = raw.map((rawRow, i) => {
          const mapped = mapHeaders(rawRow);
          const cleaned = {
            ...mapped,
            gender:   normalizeGender(mapped.gender),
            category: normalizeCategory(mapped.category),
            date_of_birth: parseDate(mapped.date_of_birth),
            email: mapped.email ? String(mapped.email).trim().toLowerCase() : undefined,
            first_name: String(mapped.first_name ?? '').trim(),
            last_name:  String(mapped.last_name  ?? '').trim(),
            identification_number: mapped.identification_number ? String(mapped.identification_number) : undefined,
            personal_phone: mapped.personal_phone ? String(mapped.personal_phone) : undefined,
            guardian_phone: mapped.guardian_phone ? String(mapped.guardian_phone) : undefined,
            city:    mapped.city    ? String(mapped.city)    : undefined,
            eps:     mapped.eps     ? String(mapped.eps)     : undefined,
            guardian_name: mapped.guardian_name ? String(mapped.guardian_name) : undefined,
            identification_type: mapped.identification_type ? String(mapped.identification_type) : undefined,
          };

          const result = rowSchema.safeParse(cleaned);
          if (result.success) {
            return { _row: i + 2, raw: rawRow, data: result.data, valid: true };
          }
          return {
            _row: i + 2,
            raw: rawRow,
            errors: result.error.errors.map(e => e.message),
            valid: false,
          };
        });

        resolve(preview);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── Bulk insert ──────────────────────────────────────────────────────────────

async function insertRows(rows: ValidRow[]): Promise<{ inserted: number; failed: number }> {
  let inserted = 0;
  let failed = 0;

  const chunks = Array.from({ length: Math.ceil(rows.length / CHUNK_SIZE) }, (_, i) =>
    rows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
  );

  for (const chunk of chunks) {
    const payload = chunk.map(r => ({
      first_name:            r.first_name,
      last_name:             r.last_name,
      identification_number: r.identification_number ?? null,
      identification_type:   r.identification_type   ?? null,
      date_of_birth:         r.date_of_birth         ?? null,
      gender:                r.gender                ?? null,
      category:              r.category,
      email:                 r.email                 ?? null,
      personal_phone:        r.personal_phone        ?? null,
      city:                  r.city                  ?? null,
      eps:                   r.eps                   ?? null,
      guardian_name:         r.guardian_name         ?? null,
      guardian_phone:        r.guardian_phone        ?? null,
      status:                'active' as const,
      is_elite_athlete:      false,
      performance_score:     0,
      dominant_distances:    [] as string[],
    }));

    const { error } = await supabase.from('athletes').insert(payload);
    if (error) {
      failed += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }

  return { inserted, failed };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'result';

interface ImportResult { inserted: number; failed: number }

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function BulkImportDialog({ open, onClose, onImported }: BulkImportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validRows  = preview.filter(r => r.valid).map(r => r.data!);
  const invalidRows = preview.filter(r => !r.valid);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ title: 'Formato no soportado', description: 'Usa .xlsx, .xls o .csv', variant: 'destructive' });
      return;
    }
    setFileName(file.name);
    setParsing(true);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        toast({ title: 'Archivo vacío', description: 'El archivo no tiene filas de datos', variant: 'destructive' });
        return;
      }
      setPreview(rows);
      setStep('preview');
    } catch {
      toast({ title: 'Error al leer el archivo', description: 'Verifica que el archivo no esté dañado', variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const importMutation = useMutation({
    mutationFn: () => insertRows(validRows),
    onSuccess: (res) => {
      setResult(res);
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      if (res.inserted > 0) onImported();
    },
    onError: () => {
      toast({ title: 'Error al importar', description: 'Ocurrió un error inesperado', variant: 'destructive' });
    },
  });

  const reset = () => {
    setStep('upload');
    setPreview([]);
    setFileName('');
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-500" />
            Importación Masiva de Atletas
          </DialogTitle>
          <DialogDescription>
            Carga un archivo Excel (.xlsx) con los datos de múltiples atletas a la vez
          </DialogDescription>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className={cn('font-medium', step === 'upload' && 'text-orange-500')}>1. Cargar archivo</span>
            <ChevronRight className="h-3 w-3" />
            <span className={cn('font-medium', step === 'preview' && 'text-orange-500')}>2. Revisar datos</span>
            <ChevronRight className="h-3 w-3" />
            <span className={cn('font-medium', step === 'result' && 'text-orange-500')}>3. Resultado</span>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">

          {/* ── STEP 1: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drop zone */}
              <label
                className={cn(
                  'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-16',
                  dragging ? 'border-orange-500 bg-orange-500/5' : 'border-border hover:border-orange-400 hover:bg-muted/30',
                  parsing && 'pointer-events-none opacity-60',
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={onInputChange} />
                <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                  {parsing
                    ? <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    : <Upload className="h-7 w-7 text-orange-500" />
                  }
                </div>
                <div className="text-center">
                  <p className="font-semibold">{parsing ? 'Procesando…' : 'Arrastra tu archivo aquí'}</p>
                  <p className="text-sm text-muted-foreground mt-1">o haz click para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Formatos: .xlsx · .xls · .csv</p>
                </div>
              </label>

              {/* Template download */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/40 border border-border">
                <FileSpreadsheet className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">¿Primera vez importando?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Descarga la plantilla con las columnas correctas y un atleta de ejemplo
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Plantilla
                </Button>
              </div>

              {/* Column reference */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Columnas reconocidas</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-0 divide-y divide-border md:divide-y-0">
                  {[
                    { col: 'nombres', req: true,  note: 'Primer nombre' },
                    { col: 'apellidos', req: true, note: 'Apellido completo' },
                    { col: 'identificacion', req: false, note: 'Cédula / TI' },
                    { col: 'tipo_id', req: false, note: 'CC, TI, CE…' },
                    { col: 'fecha_nacimiento', req: false, note: 'YYYY-MM-DD' },
                    { col: 'genero', req: false, note: 'masculino / femenino' },
                    { col: 'categoria', req: false, note: 'escuela, juvenil…' },
                    { col: 'email', req: false, note: 'Correo electrónico' },
                    { col: 'telefono', req: false, note: 'Celular' },
                    { col: 'ciudad', req: false, note: '' },
                    { col: 'acudiente', req: false, note: 'Nombre acudiente' },
                    { col: 'telefono_acudiente', req: false, note: '' },
                  ].map(({ col, req, note }) => (
                    <div key={col} className="flex items-center gap-2 px-4 py-2.5 text-xs">
                      <code className="font-mono text-orange-500">{col}</code>
                      {req && <Badge variant="destructive" className="h-4 px-1 text-[10px]">req</Badge>}
                      {note && <span className="text-muted-foreground ml-auto">{note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">{fileName}</span>
                <Badge variant="outline" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />{preview.length} filas
                </Badge>
                <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />{validRows.length} válidas
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge className="gap-1 bg-red-500/10 text-red-600 border-red-200">
                    <XCircle className="h-3 w-3" />{invalidRows.length} con errores
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="ml-auto text-xs gap-1" onClick={reset}>
                  <RotateCcw className="h-3 w-3" /> Cambiar archivo
                </Button>
              </div>

              {invalidRows.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-300/40 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 dark:text-amber-400">
                    Las filas con errores serán <strong>omitidas</strong>. Solo se importarán las {validRows.length} filas válidas.
                  </p>
                </div>
              )}

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-12">#</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Estado</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Nombre</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Identificación</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Categoría</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Género</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Email</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.map((row) => (
                        <tr
                          key={row._row}
                          className={cn(
                            'transition-colors',
                            row.valid ? 'hover:bg-muted/30' : 'bg-red-500/5 hover:bg-red-500/10',
                          )}
                        >
                          <td className="px-3 py-2 text-muted-foreground">{row._row}</td>
                          <td className="px-3 py-2">
                            {row.valid
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />
                            }
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {row.data
                              ? `${row.data.first_name} ${row.data.last_name}`
                              : `${String(row.raw.nombres ?? row.raw.nombre ?? '')} ${String(row.raw.apellidos ?? row.raw.apellido ?? '')}`
                            }
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {String(row.raw.identificacion ?? row.raw.cedula ?? '—')}
                          </td>
                          <td className="px-3 py-2">
                            {row.data?.category
                              ? <Badge variant="secondary" className="text-[10px]">{row.data.category}</Badge>
                              : <span className="text-muted-foreground">—</span>
                            }
                          </td>
                          <td className="px-3 py-2 text-muted-foreground capitalize">
                            {row.data?.gender ?? String(row.raw.genero ?? row.raw.sexo ?? '—')}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground max-w-[140px] truncate">
                            {row.data?.email ?? String(row.raw.email ?? row.raw.correo ?? '—')}
                          </td>
                          <td className="px-3 py-2 text-red-500 max-w-[180px]">
                            {row.errors?.join(' · ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Result ── */}
          {step === 'result' && result && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
              {result.inserted > 0 ? (
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {result.inserted > 0 ? '¡Importación completada!' : 'Importación fallida'}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {result.inserted > 0
                    ? `Se importaron exitosamente ${result.inserted} atleta${result.inserted !== 1 ? 's' : ''}`
                    : 'No se pudo insertar ningún registro'
                  }
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="rounded-lg bg-emerald-500/10 p-4">
                  <p className="text-3xl font-black text-emerald-600">{result.inserted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Importados</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-4">
                  <p className="text-3xl font-black text-red-600">{result.failed + invalidRows.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Omitidos</p>
                </div>
              </div>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Nueva importación
              </Button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <>
                {importMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    Importando…
                  </div>
                )}
                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={validRows.length === 0 || importMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {validRows.length} atleta{validRows.length !== 1 ? 's' : ''}
                </Button>
              </>
            )}
            {step === 'result' && result && result.inserted > 0 && (
              <Button onClick={handleClose}>Ir a la lista</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
