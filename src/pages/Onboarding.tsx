import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2,
  Phone,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

interface WizardData {
  club_name: string;
  club_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  website_url: string;
  league: string;
  country: string;
  president_name: string;
  president_email: string;
  delegate_name: string;
  delegate_phone: string;
}

const STEPS = [
  { id: 1, label: 'Club',       icon: Building2 },
  { id: 2, label: 'Contacto',   icon: Phone },
  { id: 3, label: 'Directivos', icon: Users },
  { id: 4, label: '¡Listo!',    icon: CheckCircle2 },
];

const INITIAL_DATA: WizardData = {
  club_name: '',
  club_description: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  website_url: '',
  league: '',
  country: 'Colombia',
  president_name: '',
  president_email: '',
  delegate_name: '',
  delegate_phone: '',
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);

  const update = (fields: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...fields }));

  const canAdvanceStep1 = data.club_name.trim().length >= 2;

  const handleNext = () => {
    if (step === 1 && !canAdvanceStep1) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa el nombre del club para continuar.',
        variant: 'destructive',
      });
      return;
    }
    if (step < 3) setStep((s) => s + 1);
    if (step === 3) handleSave();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // La fila de `clubs` para este usuario ya existe (la crea Fase 0 /
      // ops al provisionar el club) — RLS ("Users view own club") la
      // filtra automáticamente, solo hace falta su id para el UPDATE.
      const { data: existing, error: fetchError } = await supabase
        .from('clubs')
        .select('id')
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existing?.id) {
        throw new Error('No se encontró el club de tu cuenta. Contacta al administrador de la plataforma.');
      }

      const payload = {
        name: data.club_name,
        description: data.club_description || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        address: data.address || null,
        website_url: data.website_url || null,
        league: data.league || null,
        country: data.country || null,
        president_name: data.president_name || null,
        president_email: data.president_email || null,
        delegate_name: data.delegate_name || null,
        delegate_phone: data.delegate_phone || null,
        onboarding_completed: true,
      };

      const { error: saveError } = await supabase
        .from('clubs')
        .update(payload)
        .eq('id', existing.id);

      if (saveError) throw saveError;

      queryClient.invalidateQueries({ queryKey: ['onboarding-guard'] });
      setStep(4);
    } catch (err: unknown) {
      toast({
        title: 'Error al guardar',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⛸️</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Configura tu club</h1>
          <p className="text-slate-400 text-sm mt-1">Completa la información básica para empezar</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8 gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-16 mb-4 mx-1 transition-all ${
                      step > s.id ? 'bg-green-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <Card className="bg-slate-800/60 border-slate-700 shadow-2xl">
          <CardContent className="p-8">
            {/* Step 1 — Club */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <CardTitle className="text-white text-lg mb-1">Nombre del club</CardTitle>
                  <CardDescription className="text-slate-400">
                    Este nombre aparecerá en documentos, reportes y carnets.
                  </CardDescription>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Nombre del club *</Label>
                  <Input
                    placeholder="Ej: Club Patinadores Bogotá"
                    value={data.club_name}
                    onChange={(e) => update({ club_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Descripción / eslogan <span className="text-slate-500 font-normal">(opcional)</span></Label>
                  <Textarea
                    placeholder="Ej: Velocidad, disciplina y pasión por el patinaje"
                    value={data.club_description}
                    onChange={(e) => update({ club_description: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2 — Contacto */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <CardTitle className="text-white text-lg mb-1">Información de contacto</CardTitle>
                  <CardDescription className="text-slate-400">
                    Datos de contacto del club. Todos los campos son opcionales.
                  </CardDescription>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Correo electrónico</Label>
                    <Input
                      type="email"
                      placeholder="contacto@clubpatinadores.com"
                      value={data.contact_email}
                      onChange={(e) => update({ contact_email: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Teléfono</Label>
                    <Input
                      type="tel"
                      placeholder="601 234 5678"
                      value={data.contact_phone}
                      onChange={(e) => update({ contact_phone: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Dirección</Label>
                  <Input
                    placeholder="Calle 72 # 14-20, Bogotá"
                    value={data.address}
                    onChange={(e) => update({ address: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Sitio web</Label>
                  <Input
                    type="url"
                    placeholder="https://www.clubpatinadores.com"
                    value={data.website_url}
                    onChange={(e) => update({ website_url: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Step 3 — Directivos */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <CardTitle className="text-white text-lg mb-1">Directivos e institución</CardTitle>
                  <CardDescription className="text-slate-400">
                    Información institucional que aparece en documentos oficiales.
                  </CardDescription>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Liga deportiva</Label>
                    <Input
                      placeholder="Liga de Patinaje de Bogotá"
                      value={data.league}
                      onChange={(e) => update({ league: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">País</Label>
                    <Input
                      placeholder="Colombia"
                      value={data.country}
                      onChange={(e) => update({ country: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-3 p-4 border border-slate-600 rounded-lg">
                  <p className="text-slate-300 text-sm font-medium">Presidente del club</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Nombre</Label>
                      <Input
                        placeholder="Nombre completo"
                        value={data.president_name}
                        onChange={(e) => update({ president_name: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Email</Label>
                      <Input
                        type="email"
                        placeholder="presidente@club.com"
                        value={data.president_email}
                        onChange={(e) => update({ president_email: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-4 border border-slate-600 rounded-lg">
                  <p className="text-slate-300 text-sm font-medium">Delegado / representante</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Nombre</Label>
                      <Input
                        placeholder="Nombre completo"
                        value={data.delegate_name}
                        onChange={(e) => update({ delegate_name: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Teléfono</Label>
                      <Input
                        type="tel"
                        placeholder="310 000 0000"
                        value={data.delegate_phone}
                        onChange={(e) => update({ delegate_phone: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Éxito */}
            {step === 4 && (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500">
                    <CheckCircle2 className="h-10 w-10 text-green-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    ¡{data.club_name} está listo!
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                    Tu club ha sido configurado. Ahora puedes agregar coaches, registrar atletas
                    y crear el horario de entrenamientos.
                  </p>
                </div>
                <div className="space-y-3 text-left max-w-xs mx-auto">
                  {[
                    'Agregar coaches y staff en Usuarios',
                    'Registrar atletas por categoría',
                    'Crear el horario semanal de entrenamientos',
                    'Configurar cuotas y pagos',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => navigate('/admin-dashboard', { replace: true })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  size="lg"
                >
                  Ir al panel de administración
                </Button>
              </div>
            )}

            {/* Navigation */}
            {step < 4 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1 || saving}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                  ) : step === 3 ? (
                    <>Guardar y finalizar <CheckCircle2 className="ml-1 h-4 w-4" /></>
                  ) : (
                    <>Siguiente <ChevronRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {step < 4 && (
          <p className="text-center text-slate-500 text-xs mt-4">
            Paso {step} de 3 · Puedes completar el resto en{' '}
            <button
              onClick={() => navigate('/admin-dashboard', { replace: true })}
              className="text-slate-400 underline hover:text-slate-300"
            >
              Configuración del club
            </button>{' '}
            más tarde.
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
