import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trophy, Medal, Award, Info, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AwardScheme = 'clasico' | 'resolucion_061' | 'personalizado';
type CutoffSystem = 'fcp' | 'worldskate';

const SCHEME_INFO = {
  clasico: {
    label: 'Clásico — Oro, Plata, Bronce',
    description: 'Los 3 primeros puestos reciben medallas de oro, plata y bronce en todas las categorías.',
    icon: <Trophy className="h-5 w-5 text-yellow-500" />,
  },
  resolucion_061: {
    label: 'Resolución 061 — Liga Bogotá',
    description: 'Esquema oficial de la Liga de Patinaje de Bogotá según Resolución 061. Mini <11 años reciben reconocimientos igualitarios "destacado". Desde Infantil 12 en adelante: podio clásico.',
    icon: <Medal className="h-5 w-5 text-blue-500" />,
  },
  personalizado: {
    label: 'Personalizado',
    description: 'Configura el número de premiados y tipo de medalla para cada categoría individualmente.',
    icon: <Award className="h-5 w-5 text-purple-500" />,
  },
};

const RESOLUTION_TABLE = [
  { category: 'Mini 7 años', count: 10, type: 'Destacado (igualitario)' },
  { category: 'Mini 8 años', count: 7, type: 'Destacado (igualitario)' },
  { category: 'Mini 9 años', count: 7, type: 'Destacado (igualitario)' },
  { category: 'Mini 10 años', count: 7, type: 'Destacado (igualitario)' },
  { category: 'Pre-infantil 11 años', count: 5, type: 'Destacado (igualitario)' },
  { category: 'Infantil 12 años', count: 5, type: '🥇 1° | 🥈 2°-3° | 🥉 4°-5°' },
  { category: 'Junior 13 años', count: 5, type: '🥇 1° | 🥈 2°-3° | 🥉 4°-5°' },
  { category: 'Prejuvenil 14 años', count: 3, type: '🥇 Oro | 🥈 Plata | 🥉 Bronce' },
  { category: 'Juvenil 1er año', count: 3, type: '🥇 Oro | 🥈 Plata | 🥉 Bronce' },
  { category: 'Juvenil 2do año', count: 3, type: '🥇 Oro | 🥈 Plata | 🥉 Bronce' },
  { category: 'Juvenil 3er año', count: 3, type: '🥇 Oro | 🥈 Plata | 🥉 Bronce' },
  { category: 'Mayores', count: 3, type: '🥇 Oro | 🥈 Plata | 🥉 Bronce' },
  { category: 'Masters', count: 3, type: '🥇 Oro | 🥈 Plata | 🥉 Bronce' },
];

interface CustomCategoryConfig {
  count: number;
  type: 'clasico' | 'destacado';
}

const CATEGORIES = RESOLUTION_TABLE.map(r => r.category);

export function AwardSchemeSettings() {
  const [activeScheme, setActiveScheme] = useState<AwardScheme>('resolucion_061');
  const [cutoffSystem, setCutoffSystem] = useState<CutoffSystem>('fcp');
  const [customConfig, setCustomConfig] = useState<Record<string, CustomCategoryConfig>>(() =>
    Object.fromEntries(CATEGORIES.map(c => [c, { count: 3, type: 'clasico' as const }]))
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['active_award_scheme', 'category_cutoff_system']);

      data?.forEach(row => {
        if (row.setting_key === 'active_award_scheme') setActiveScheme(row.setting_value as AwardScheme);
        if (row.setting_key === 'category_cutoff_system') setCutoffSystem(row.setting_value as CutoffSystem);
      });

      const { data: schemes } = await supabase
        .from('award_scheme_configs')
        .select('custom_config')
        .eq('scheme_type', 'personalizado')
        .limit(1)
        .maybeSingle();

      if (schemes?.custom_config) {
        setCustomConfig(schemes.custom_config as Record<string, CustomCategoryConfig>);
      }

      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('system_settings').upsert([
          { setting_key: 'active_award_scheme', setting_value: activeScheme, setting_type: 'string', category: 'competitions' },
          { setting_key: 'category_cutoff_system', setting_value: cutoffSystem, setting_type: 'string', category: 'competitions' },
        ], { onConflict: 'setting_key' }),

        activeScheme === 'personalizado'
          ? supabase.from('award_scheme_configs').upsert({
              scheme_type: 'personalizado',
              name: 'Configuración personalizada',
              custom_config: customConfig,
              is_active: true,
            }, { onConflict: 'scheme_type' })
          : Promise.resolve({ error: null }),
      ]);

      toast.success('Configuración de premiación guardada');
    } catch (e) {
      console.error('Error guardando config de premiación:', e);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">Cargando configuración...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Corte de edad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sistema de Categorías — Fecha de Corte</CardTitle>
          <CardDescription>Define cómo se calcula la categoría de cada deportista</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={cutoffSystem}
            onValueChange={v => setCutoffSystem(v as CutoffSystem)}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
              <RadioGroupItem value="fcp" id="fcp" className="mt-0.5" />
              <Label htmlFor="fcp" className="cursor-pointer flex-1">
                <span className="font-medium">FCP / Liga de Bogotá — Corte 1 de julio</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Si el deportista cumple años antes del 1 de julio, esa es su edad de categoría.
                  Si cumple el 1 de julio o después, se le descuenta 1 año. Estándar colombiano.
                </p>
              </Label>
              <Badge variant="secondary" className="text-xs">Recomendado</Badge>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
              <RadioGroupItem value="worldskate" id="worldskate" className="mt-0.5" />
              <Label htmlFor="worldskate" className="cursor-pointer flex-1">
                <span className="font-medium">World Skate — Corte 31 de diciembre</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Edad = año de competencia − año de nacimiento, sin importar el mes.
                  Para eventos internacionales y selecciones.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Esquema de premiación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Esquema de Premiación</CardTitle>
          <CardDescription>Define cómo se asignan medallas y reconocimientos por competencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={activeScheme}
            onValueChange={v => setActiveScheme(v as AwardScheme)}
            className="space-y-3"
          >
            {(Object.entries(SCHEME_INFO) as [AwardScheme, typeof SCHEME_INFO[keyof typeof SCHEME_INFO]][]).map(([key, info]) => (
              <div
                key={key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${activeScheme === key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
              >
                <RadioGroupItem value={key} id={key} className="mt-0.5" />
                <Label htmlFor={key} className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {info.icon}
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Preview Resolución 061 */}
          {activeScheme === 'resolucion_061' && (
            <div className="mt-4 border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Detalle por categoría — Resolución 061
              </div>
              <div className="divide-y divide-border">
                {RESOLUTION_TABLE.map(row => (
                  <div key={row.category} className="flex items-center justify-between px-4 py-2 text-xs">
                    <span className="font-medium">{row.category}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{row.count} premiados</Badge>
                      <span className="text-muted-foreground">{row.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuración personalizada */}
          {activeScheme === 'personalizado' && (
            <div className="mt-4 border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                Configuración por categoría
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex-1 text-xs font-medium">{cat}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Input
                        type="number"
                        min={1}
                        max={15}
                        value={customConfig[cat]?.count ?? 3}
                        onChange={e => setCustomConfig(prev => ({
                          ...prev,
                          [cat]: { ...prev[cat], count: parseInt(e.target.value) || 3 },
                        }))}
                        className="h-7 w-14 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">premiados</span>
                      <Select
                        value={customConfig[cat]?.type ?? 'clasico'}
                        onValueChange={v => setCustomConfig(prev => ({
                          ...prev,
                          [cat]: { ...prev[cat], type: v as 'clasico' | 'destacado' },
                        }))}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clasico">🥇 Podio</SelectItem>
                          <SelectItem value="destacado">⭐ Destacado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
}
