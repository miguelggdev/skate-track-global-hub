import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Loader2, Eye, PenLine, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { generatePermissionLetterPDF } from '@/lib/pdf-generator';
import { useSaveDocument } from '@/hooks/useDocumentGeneration';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  athlete_id: z.string().min(1, 'Selecciona un atleta'),
  competition_id: z.string().min(1, 'Selecciona una competencia'),
  director_title: z.string().min(1, 'Requerido'),
  director_name: z.string().min(1, 'Requerido'),
  institution_name: z.string().min(1, 'Requerido'),
  club_name: z.string().min(1, 'Requerido'),
  club_city: z.string().min(1, 'Requerido'),
  coach_name: z.string().min(1, 'Requerido'),
  issue_date: z.string().min(1, 'Requerido'),
  additional_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function PermissionLetterGenerator() {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const saveDoc = useSaveDocument();
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      director_title: 'Rector(a)',
      director_name: '',
      institution_name: '',
      club_name: 'Club de Patinaje',
      club_city: 'Bogotá',
      coach_name: '',
      issue_date: new Date().toISOString().slice(0, 10),
      additional_notes: '',
    },
  });

  // Pre-fill coach name from logged-in user
  useEffect(() => {
    if (profile?.first_name) {
      form.setValue('coach_name', `${profile.first_name} ${profile.last_name}`);
    }
  }, [profile, form]);

  // Athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-active-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, school_name')
        .eq('status', 'active')
        .order('last_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Competitions
  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name, start_date, end_date, location')
        .order('start_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const watchAthleteId = form.watch('athlete_id');
  const watchCompId = form.watch('competition_id');

  const selectedAthlete = athletes.find(a => a.id === watchAthleteId);
  const selectedComp = competitions.find(c => c.id === watchCompId);

  // Auto-fill institution from athlete school
  useEffect(() => {
    if (selectedAthlete?.school_name) {
      form.setValue('institution_name', selectedAthlete.school_name);
    }
  }, [selectedAthlete, form]);

  // Load stored signature for the selected athlete
  const { data: athleteSignature } = useQuery({
    queryKey: ['athlete-signature-doc', watchAthleteId],
    queryFn: async () => {
      if (!watchAthleteId) return null;
      const { data } = await supabase
        .from('documents')
        .select('file_url')
        .eq('athlete_id', watchAthleteId)
        .eq('document_type', 'firma_digital')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data?.file_url) return null;
      // Fetch as data URL so jsPDF can embed it directly
      try {
        const res = await fetch(data.file_url);
        const blob = await res.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    },
    enabled: !!watchAthleteId,
  });

  const handleGenerate = async (values: FormValues) => {
    if (!selectedAthlete || !selectedComp) return;
    setGenerating(true);
    try {
      generatePermissionLetterPDF({
        clubName: values.club_name,
        clubCity: values.club_city,
        coachName: values.coach_name,
        directorTitle: values.director_title,
        directorName: values.director_name,
        institutionName: values.institution_name,
        athleteName: `${selectedAthlete.first_name} ${selectedAthlete.last_name}`,
        athleteCategory: selectedAthlete.category ?? '',
        competitionName: selectedComp.name,
        competitionCity: selectedComp.location ?? '',
        startDate: selectedComp.start_date,
        endDate: selectedComp.end_date ?? '',
        issueDate: values.issue_date,
        additionalNotes: values.additional_notes ?? '',
        signatureDataUrl: athleteSignature ?? undefined,
      });

      await saveDoc.mutateAsync({
        title: `Carta permiso — ${selectedAthlete.first_name} ${selectedAthlete.last_name} — ${selectedComp.name}`,
        document_type: 'carta_permiso_colegio',
        athlete_id: values.athlete_id,
        competition_id: values.competition_id,
        notes: values.institution_name,
      });

      toast({ title: 'PDF generado', description: 'La carta se descargó automáticamente.' });
    } catch (e) {
      console.error('Error generando carta:', e);
      toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-orange-500" />
            Datos de la Carta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
              {/* Atleta */}
              <FormField control={form.control} name="athlete_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Atleta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar atleta…" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {athletes.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.last_name}, {a.first_name}
                          <span className="text-muted-foreground ml-1 text-xs">({a.category})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Competencia */}
              <FormField control={form.control} name="competition_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Competencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar competencia…" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {competitions.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} <span className="text-muted-foreground text-xs">({c.start_date?.slice(0, 10)})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />

              {/* Destinatario */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Destinatario</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="director_title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Rector(a)">Rector(a)</SelectItem>
                        <SelectItem value="Director(a)">Director(a)</SelectItem>
                        <SelectItem value="Coordinador(a)">Coordinador(a)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="director_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl><Input placeholder="Nombre completo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="institution_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Institución Educativa</FormLabel>
                  <FormControl><Input placeholder="Nombre del colegio / universidad" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />

              {/* Club */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Club</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="club_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Club</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="club_city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="coach_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Entrenador / Director Deportivo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="issue_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Emisión</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="additional_notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas adicionales (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Párrafo adicional para incluir en la carta…"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Signature status indicator */}
              {watchAthleteId && (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md border ${
                  athleteSignature
                    ? 'bg-emerald-500/10 border-emerald-300 text-emerald-700'
                    : 'bg-amber-500/10 border-amber-300 text-amber-700'
                }`}>
                  {athleteSignature
                    ? <><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Firma digital del atleta disponible — se incluirá en el PDF</>
                    : <><PenLine className="h-3.5 w-3.5 flex-shrink-0" /> Sin firma digital — el atleta puede capturarla en su pestaña Documentos</>
                  }
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview(p => !p)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  {preview ? 'Ocultar vista previa' : 'Vista previa'}
                </Button>
                <Button type="submit" disabled={generating} className="flex-1">
                  {generating
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generando…</>
                    : <><Download className="h-4 w-4 mr-2" />Generar PDF</>
                  }
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className={preview ? '' : 'opacity-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Vista Previa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAthlete && selectedComp ? (
            <div className="space-y-3 text-sm font-mono border rounded-lg p-4 bg-muted/30 leading-relaxed">
              <div className="bg-orange-500 text-white rounded px-3 py-2 text-center font-bold">
                {form.watch('club_name') || 'CLUB DE PATINAJE'}
              </div>
              <div className="text-right text-muted-foreground text-xs">
                {form.watch('club_city')}, {form.watch('issue_date')}
              </div>
              <div>
                <strong>{form.watch('director_title')} {form.watch('director_name') || '[Nombre]'}</strong><br />
                <span className="text-muted-foreground">{form.watch('institution_name') || '[Institución]'}</span>
              </div>
              <div className="text-xs text-muted-foreground italic">
                <strong>Asunto:</strong> Permiso para participar en {selectedComp.name}
              </div>
              <p className="text-xs text-muted-foreground">
                Por medio de la presente, el {form.watch('club_name')} se permite solicitar respetuosamente
                su valioso apoyo para conceder permiso al/a la estudiante deportista{' '}
                <strong>{selectedAthlete.first_name} {selectedAthlete.last_name}</strong>{' '}
                (categoría <Badge variant="outline" className="text-xs">{selectedAthlete.category}</Badge>)...
              </p>
              <div className="pt-2 border-t">
                <div className="w-24 h-0.5 bg-orange-500 mb-1" />
                <strong className="text-xs">{form.watch('coach_name') || '[Entrenador]'}</strong>
                <p className="text-xs text-muted-foreground">Entrenador / Director Deportivo</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Selecciona atleta y competencia para ver la vista previa</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
