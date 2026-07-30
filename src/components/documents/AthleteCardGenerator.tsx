import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Loader2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateAthleteCardPDF } from '@/lib/pdf-generator';
import { useSaveDocument } from '@/hooks/useDocumentGeneration';

export function AthleteCardGenerator() {
  const { toast } = useToast();
  const saveDoc = useSaveDocument();

  const [athleteId, setAthleteId] = useState('');
  const [clubName, setClubName] = useState('Club de Patinaje');
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-active-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, identification_number, identification_type')
        .eq('status', 'active')
        .order('last_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const selected = athletes.find(a => a.id === athleteId);

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      await generateAthleteCardPDF({
        id: selected.id,
        firstName: selected.first_name,
        lastName: selected.last_name,
        category: selected.category ?? '',
        identificationNumber: selected.identification_number ?? '',
        year,
        clubName,
      });

      await saveDoc.mutateAsync({
        title: `Carnet — ${selected.first_name} ${selected.last_name} ${year}`,
        document_type: 'carnet_deportista',
        athlete_id: selected.id,
        notes: `Año ${year}`,
      });

      toast({ title: 'Carnet generado', description: 'El PDF se descargó automáticamente.' });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo generar el carnet.', variant: 'destructive' });
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
            <CreditCard className="h-4 w-4 text-orange-500" />
            Datos del Carnet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Atleta</Label>
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar atleta…" />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.last_name}, {a.first_name}
                    <span className="text-muted-foreground ml-1 text-xs">({a.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre del Club</Label>
            <Input value={clubName} onChange={e => setClubName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Año de Vigencia</Label>
            <Input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              min={2020}
              max={2035}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!athleteId || generating}
            className="w-full"
          >
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generando…</>
              : <><Download className="h-4 w-4 mr-2" />Generar Carnet PDF</>
            }
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Tamaño estándar CR80 — 85.6 × 54 mm
          </p>
        </CardContent>
      </Card>

      {/* Card Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            Vista Previa del Carnet
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          {selected ? (
            /* Scaled card preview — proportional to 85.6 × 54 mm */
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl border border-border"
              style={{ width: 342, height: 216, background: '#fafafa' }}
            >
              {/* Orange top bar */}
              <div className="absolute inset-x-0 top-0 h-10 bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm tracking-wide">{clubName.toUpperCase()}</span>
              </div>

              {/* Left accent */}
              <div className="absolute left-0 top-10 bottom-0 w-2.5 bg-orange-500" />

              {/* Subtitle strip */}
              <div className="absolute inset-x-0 top-10 h-5 bg-orange-50 flex items-center pl-4">
                <span className="text-orange-600 font-bold text-xs tracking-widest">CARNET DEPORTISTA</span>
              </div>

              {/* Content */}
              <div className="absolute top-[60px] left-4 right-24">
                <p className="font-bold text-gray-900 text-lg leading-tight">
                  {selected.first_name}<br />{selected.last_name}
                </p>
                <Badge className="mt-2 bg-orange-500 hover:bg-orange-500 text-white text-xs">
                  {(selected.category ?? '').toUpperCase()}
                </Badge>
                {selected.identification_number && (
                  <div className="mt-3">
                    <p className="text-[10px] text-gray-400">Identificación</p>
                    <p className="text-xs font-bold text-gray-700">{selected.identification_number}</p>
                  </div>
                )}
              </div>

              {/* QR placeholder */}
              <div className="absolute top-[60px] right-4 w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-gray-400" />
              </div>

              {/* Bottom */}
              <div className="absolute bottom-0 inset-x-0 border-t border-gray-100 px-4 py-2">
                <p className="text-[10px] text-gray-400">VIGENCIA {year}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <CreditCard className="h-14 w-14 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Selecciona un atleta para ver la vista previa</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
