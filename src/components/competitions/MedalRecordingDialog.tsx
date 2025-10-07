import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Medal, Trophy, Timer } from 'lucide-react';
import { useMedalRecording, useCompetitionEvents, useCompetitionParticipants } from '@/hooks/useMedalRecording';

const medalSchema = z.object({
  athlete_id: z.string().min(1, 'Athlete is required'),
  medal_type: z.enum(['gold', 'silver', 'bronze']),
  time_achieved: z.string().optional(),
  event_location: z.string().optional(),
  position: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type MedalFormData = z.infer<typeof medalSchema>;

interface MedalRecordingDialogProps {
  competitionId: string;
  competitionName: string;
}

const EVENT_TYPES = [
  { value: 'speed_100m', label: '100m Speed' },
  { value: 'speed_200m', label: '200m Speed' },
  { value: 'speed_300m', label: '300m Speed' },
  { value: 'speed_500m', label: '500m Speed' },
  { value: 'speed_1000m', label: '1000m Speed' },
  { value: 'speed_1500m', label: '1500m Speed' },
  { value: 'speed_3000m', label: '3000m Speed' },
  { value: 'speed_5000m', label: '5000m Speed' },
  { value: 'speed_10000m', label: '10000m Speed' },
  { value: 'artistic_figures', label: 'Artistic Figures' },
  { value: 'artistic_freestyle', label: 'Freestyle' },
  { value: 'relay_4x100m', label: '4x100m Relay' },
  { value: 'marathon', label: 'Marathon' },
  { value: 'elimination', label: 'Elimination' },
  { value: 'points_race', label: 'Points Race' },
];

export const MedalRecordingDialog = ({ competitionId, competitionName }: MedalRecordingDialogProps) => {
  const [open, setOpen] = useState(false);
  const { recordMedal } = useMedalRecording();
  const { data: events } = useCompetitionEvents(competitionId);
  const { data: participants } = useCompetitionParticipants(competitionId);

  const form = useForm<MedalFormData>({
    resolver: zodResolver(medalSchema),
    defaultValues: {
      athlete_id: '',
      medal_type: 'gold',
      time_achieved: '',
      event_location: '',
      notes: '',
    },
  });

  const onSubmit = async (data: MedalFormData) => {
    await recordMedal.mutateAsync({
      competition_id: competitionId,
      athlete_id: data.athlete_id,
      medal_type: data.medal_type,
      time_achieved: data.time_achieved,
      event_location: data.event_location,
      position: data.position,
      notes: data.notes,
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trophy className="mr-2 h-4 w-4" />
          Record Medals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            Record Medal - {competitionName}
          </DialogTitle>
          <DialogDescription>
            Record medals won by athletes in this competition
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="athlete_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Athlete</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select athlete" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {participants?.map((participant: any) => (
                        <SelectItem key={participant.athlete_id} value={participant.athlete_id}>
                          {participant.athletes?.first_name} {participant.athletes?.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medal Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gold">🥇 Gold</SelectItem>
                      <SelectItem value="silver">🥈 Silver</SelectItem>
                      <SelectItem value="bronze">🥉 Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time_achieved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time (mm:ss.ms)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Timer className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="01:23.45"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="event_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Track, venue, or area" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about the performance..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordMedal.isPending}>
                {recordMedal.isPending ? 'Recording...' : 'Record Medal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
