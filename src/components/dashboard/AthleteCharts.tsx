import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { Trophy, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

// No existe todavía una tabla de evaluaciones técnicas por atleta en el
// esquema — este radar se muestra vacío hasta que esa feature se construya,
// en vez de inventar puntajes.
const SKILLS_DATA: Array<{ skill: string; score: number }> = [];

interface NextComp {
  name: string;
  date: string;
  location: string;
  daysLeft: number;
}

function useNextCompetition(athleteId: string | null): NextComp | null {
  const [comp, setComp] = useState<NextComp | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    const today = new Date().toISOString().split('T')[0];

    supabase
      .from('competitions')
      .select('name, location, start_date')
      .gt('start_date', today)
      .order('start_date')
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const c = data[0];
          setComp({
            name: c.name,
            date: c.start_date,
            location: c.location ?? 'Colombia',
            daysLeft: Math.max(0, Math.ceil((new Date(c.start_date).getTime() - Date.now()) / 86400000)),
          });
        }
      });
  }, [athleteId]);

  return comp;
}

export function AthleteSkillsRadar({ athleteId }: { athleteId?: string }) {
  if (SKILLS_DATA.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Perfil de Capacidades</CardTitle>
          <CardDescription>Evaluación técnica del atleta</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-10">
            Sin evaluaciones técnicas registradas todavía
          </p>
        </CardContent>
      </Card>
    );
  }

  const avg = Math.round(SKILLS_DATA.reduce((s, d) => s + d.score, 0) / SKILLS_DATA.length);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Perfil de Capacidades</CardTitle>
          <CardDescription>Evaluación técnica del atleta</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-primary tabular-nums">{avg}</p>
          <p className="text-[10px] text-muted-foreground">puntos de 100</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={SKILLS_DATA} margin={{ top: 8, right: 20, left: 20, bottom: 8 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} strokeWidth={2.5} dot={{ fill: 'hsl(var(--chart-1))', r: 3 }} />
              <Tooltip {...TT} formatter={(v: number) => [`${v}/100`, 'Puntaje']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {SKILLS_DATA.map(d => (
            <div key={d.skill} className="text-center">
              <p className={`text-sm font-bold tabular-nums ${d.score >= 80 ? 'text-emerald-500' : d.score >= 70 ? 'text-amber-500' : 'text-muted-foreground'}`}>{d.score}</p>
              <p className="text-[10px] text-muted-foreground">{d.skill}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AthleteNextCompetition({ athleteId }: { athleteId?: string }) {
  const comp = useNextCompetition(athleteId || null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!comp) return null;

  const msLeft = new Date(comp.date).getTime() - Date.now();
  const days = Math.floor(msLeft / 86400000);
  const hours = Math.floor((msLeft % 86400000) / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  const secs = Math.floor((msLeft % 60000) / 1000);

  return (
    <Card className="animate-fade-in delay-75 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <CardTitle className="text-sm font-semibold">Próxima Competencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-bold text-foreground">{comp.name}</p>
          <p className="text-xs text-muted-foreground">{comp.location}</p>
        </div>
        {msLeft > 0 ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[{ v: days, l: 'Días' }, { v: hours, l: 'Horas' }, { v: mins, l: 'Min' }, { v: secs, l: 'Seg' }].map((u, i) => (
              <div key={i} className="bg-background rounded-lg py-2 border border-border">
                <p className="text-lg font-black tabular-nums text-primary leading-none">{String(u.v).padStart(2, '0')}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{u.l}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
            <Clock className="h-4 w-4" /> ¡Hoy es el día!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AthleteAchievements({ awards }: { awards?: Array<{ award_name: string; award_type: string; award_date?: string }> }) {
  const recent = (awards ?? []).slice(0, 4);

  if (!recent.length) return null;

  const typeColor: Record<string, string> = {
    gold: 'text-yellow-500',
    silver: 'text-slate-400',
    bronze: 'text-amber-600',
    diploma: 'text-blue-500',
  };

  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Logros Recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.map((a, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border">
            <span className="text-lg">{a.award_type === 'gold' ? '🥇' : a.award_type === 'silver' ? '🥈' : a.award_type === 'bronze' ? '🥉' : '🏅'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{a.award_name}</p>
              {a.award_date && <p className="text-[10px] text-muted-foreground">{new Date(a.award_date).toLocaleDateString('es', { month: 'short', year: 'numeric' })}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
