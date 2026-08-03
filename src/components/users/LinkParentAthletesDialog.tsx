import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/pages/UserManagement';

interface Props {
  parent: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  category: string;
  status: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  escuela: 'Escuela', menores: 'Menores', transicion: 'Transición',
  prejuvenil: 'Prejuvenil', juvenil: 'Juvenil', mayores: 'Mayores',
  preclub: 'Preclub', adultos: 'Adultos',
};

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export function LinkParentAthletesDialog({ parent, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // All athletes
  const { data: athletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ['athletes-for-linking'],
    queryFn: async () => {
      const { data } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, status')
        .eq('status', 'active')
        .order('first_name');
      return (data ?? []) as Athlete[];
    },
    enabled: open,
  });

  // Existing links for this parent
  const { data: existingLinks = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['parent-links', parent?.id],
    queryFn: async () => {
      if (!parent) return [];
      const { data } = await supabase
        .from('parent_athletes' as never)
        .select('athlete_id')
        .eq('parent_user_id', parent.id) as unknown as {
          data: { athlete_id: string }[] | null;
        };
      return (data ?? []).map(l => l.athlete_id);
    },
    enabled: open && !!parent,
  });

  // Sync checkboxes when existing links load
  useEffect(() => {
    if (!loadingLinks) {
      setSelected(new Set(existingLinks));
    }
  }, [existingLinks, loadingLinks]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!parent) return;

      const current = new Set(existingLinks);
      const toAdd    = [...selected].filter(id => !current.has(id));
      const toRemove = [...current].filter(id => !selected.has(id));

      const ops: Promise<unknown>[] = [];

      if (toAdd.length > 0) {
        ops.push(
          supabase
            .from('parent_athletes' as never)
            .insert(toAdd.map(athlete_id => ({ parent_user_id: parent.id, athlete_id })))
        );
      }

      for (const athleteId of toRemove) {
        ops.push(
          supabase
            .from('parent_athletes' as never)
            .delete()
            .eq('parent_user_id', parent.id)
            .eq('athlete_id', athleteId)
        );
      }

      await Promise.all(ops);
    },
    onSuccess: () => {
      toast({ title: 'Vinculación guardada', description: 'Los atletas fueron actualizados.' });
      qc.invalidateQueries({ queryKey: ['parent-links', parent?.id] });
      qc.invalidateQueries({ queryKey: ['parent-athletes'] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar la vinculación.', variant: 'destructive' });
    },
  });

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = athletes.filter(a => {
    const q = search.toLowerCase();
    return (
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q)
    );
  });

  const isLoading = loadingAthletes || loadingLinks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Vincular atletas
          </DialogTitle>
          <DialogDescription>
            {parent
              ? `Selecciona los atletas que puede ver ${parent.first_name} ${parent.last_name}.`
              : 'Selecciona atletas para vincular.'}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atleta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? 'Sin resultados' : 'No hay atletas activos'}
            </p>
          ) : (
            filtered.map(athlete => {
              const checked = selected.has(athlete.id);
              return (
                <label
                  key={athlete.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  htmlFor={`athlete-${athlete.id}`}
                >
                  <Checkbox
                    id={`athlete-${athlete.id}`}
                    checked={checked}
                    onCheckedChange={() => toggle(athlete.id)}
                  />
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {initials(athlete.first_name, athlete.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {athlete.first_name} {athlete.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {CATEGORY_LABEL[athlete.category] ?? athlete.category}
                    </p>
                  </div>
                  {checked && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Vinculado
                    </Badge>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {selected.size} atleta{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar vinculación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
