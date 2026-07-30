
import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAthletes } from '@/hooks/useAthletes';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAttendanceManagement } from '@/hooks/useAttendanceManagement';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, CheckSquare, Users, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAttendanceDialogProps {
  children: React.ReactNode;
}

const workoutOptions = [
  { value: 'gym', label: 'Gym' },
  { value: 'road_skating', label: 'Road skating' },
  { value: 'track_skating', label: 'Track skating' },
  { value: 'bicycle', label: 'Bike' },
  { value: 'static_bicycle', label: 'Stationary bike' },
  { value: 'simulator', label: 'Simulator' },
] as const;

export default function QuickAttendanceDialog({ children }: QuickAttendanceDialogProps) {
  const [open, setOpen] = useState(false);
  const { profile, isAthlete } = useUserProfile();
  const { data: athletes = [] } = useAthletes();
  const { registerBulkAttendance, isBulkRegistering } = useAttendanceManagement();
  const { toast } = useToast();

  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('18:00');
  const [durationHours, setDurationHours] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('0');
  const [trainingType, setTrainingType] = useState('gym');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | string>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const todaysStr = useMemo(() => format(date, 'yyyy-MM-dd'), [date]);

  const filteredAthletes = useMemo(() => {
    let list = athletes;
    if (isAthlete && profile?.id) {
      list = list.filter(a => a.user_id === profile.id);
    }
    if (category !== 'all') {
      list = list.filter(a => a.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => `${a.first_name ?? ''} ${a.last_name ?? ''}`.toLowerCase().includes(q));
    }
    return list;
  }, [athletes, isAthlete, profile?.id, category, search]);

  const allChecked = useMemo(() => filteredAthletes.length > 0 && filteredAthletes.every(a => selected[a.id]), [filteredAthletes, selected]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = { ...selected };
    filteredAthletes.forEach(a => { next[a.id] = checked; });
    setSelected(next);
  };

  const computeEndTime = () => {
    const [h, m] = startTime.split(':').map(Number);
    const durH = parseInt(durationHours || '0', 10);
    const durM = parseInt(durationMinutes || '0', 10);
    const totalM = h * 60 + m + durH * 60 + durM;
    const endH = Math.floor(totalM / 60) % 24;
    const endM = totalM % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!trainingType || !startTime) {
      toast({ title: 'Missing fields', description: 'Please select training type and start time.', variant: 'destructive' });
      return;
    }
    const selectedIds = Object.keys(selected).filter(id => selected[id]);
    if (selectedIds.length === 0) {
      toast({ title: 'No athletes selected', description: 'Select at least one athlete.', variant: 'destructive' });
      return;
    }

    try {
      const endTime = computeEndTime();

      // Create training session
      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          name: `${workoutOptions.find(o => o.value === trainingType)?.label} Training`,
          date: todaysStr,
          start_time: startTime,
          end_time: endTime,
          training_type: trainingType as any,
          description: `${workoutOptions.find(o => o.value === trainingType)?.label} Training`,
        })
        .select()
        .single();

      if (sessionError || !session) throw sessionError || new Error('No session created');

      // Prepare attendance data for bulk insert using the new RPC
      const attendanceRows = selectedIds.map(athlete_id => ({
        training_session_id: session.id,
        athlete_id,
        attended: true,
      }));

      // Use the new bulk RPC function
      registerBulkAttendance(attendanceRows);

      setOpen(false);
      setSelected({});
    } catch (e: any) {
      toast({ title: 'Error', description: 'Could not create training session: ' + (e.message || 'Unknown error'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" /> Register Attendance
          </DialogTitle>
          <DialogDescription>Record a training session and mark attendance.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Workout type</Label>
              <Select value={trainingType} onValueChange={setTrainingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {workoutOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Duration (hours)</Label>
              <Input type="number" min={0} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" min={0} max={59} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </div>
            <div className="flex items-end text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Ends at {computeEndTime()}</div>
            </div>
          </div>

          {/* Athlete Filters */}
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Input placeholder="Search athlete..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="escuela">Escuela</SelectItem>
                    <SelectItem value="menores">Menores</SelectItem>
                    <SelectItem value="transicion">Transición</SelectItem>
                    <SelectItem value="prejuvenil">Prejuvenil</SelectItem>
                    <SelectItem value="juvenil">Juvenil</SelectItem>
                    <SelectItem value="mayores">Mayores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2">
                {!isAthlete && (
                  <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                    <Users className="h-4 w-4 mr-1" /> All
                  </Button>
                )}
                {!isAthlete && (
                  <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y">
              {filteredAthletes.map(a => (
                <label key={a.id} className="flex items-center gap-3 py-2">
                  <Checkbox
                    checked={!!selected[a.id]}
                    onCheckedChange={(c) => setSelected(prev => ({ ...prev, [a.id]: !!c }))}
                    disabled={isAthlete && a.user_id !== profile?.id}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{a.first_name} {a.last_name}</div>
                    <div className="text-xs text-muted-foreground">{a.category} · {a.level}</div>
                  </div>
                </label>
              ))}
              {filteredAthletes.length === 0 && (
                <div className="text-sm text-muted-foreground py-6 text-center">No athletes found</div>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isBulkRegistering}>Cancel</Button>
            <Button onClick={handleSave} disabled={isBulkRegistering}>
              <Activity className="h-4 w-4 mr-2" />
              {isBulkRegistering ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
