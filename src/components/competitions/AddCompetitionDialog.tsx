import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { useCreateCompetitionWithParticipants } from '@/hooks/useCompetitions';
import { useAthletesByCategory } from '@/hooks/useAthletes';
import { useToast } from '@/hooks/use-toast';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

// Category and level mappings
const CATEGORY_OPTIONS = [
  { value: 'escuela', label: 'Escuela' },
  { value: 'menores', label: 'Menores' },
  { value: 'transicion', label: 'Transición' },
  { value: 'mayores', label: 'Mayores' }
] as const;

const LEVEL_OPTIONS = {
  escuela: [{ value: 'escuela', label: 'Escuela' }],
  menores: [
    { value: 'mini_infantil', label: '7 años' },
    { value: 'pre_infantil', label: '8 años' },
    { value: 'infantil', label: '9 años' },
    { value: 'infantil', label: '10 años' }
  ],
  transicion: [
    { value: 'junior', label: '11 años' },
    { value: 'pre_juvenil', label: '12 años' },
    { value: 'prejuveniles', label: '13 años' }
  ],
  mayores: [
    { value: 'prejuveniles', label: 'Prejuvenil' },
    { value: 'juvenil_primer_ano', label: 'Juvenil 1' },
    { value: 'juvenil_segundo_ano', label: 'Juvenil 2' },
    { value: 'juvenil_tercer_ano', label: 'Juvenil 3' },
    { value: 'mayores_unica', label: 'Mayores' }
  ]
} as const;

const competitionSchema = z.object({
  name: z.string().min(1, 'Competition name is required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    required_error: 'End date is required',
  }),
  category: z.enum(['escuela', 'menores', 'transicion', 'mayores']).optional(),
  level: z.array(z.string()).optional(),
  entry_fee: z.string().optional(),
  prize_pool: z.string().optional(),
  max_participants: z.string().optional(),
  registration_deadline: z.date().optional(),
  participants: z.array(z.string()).optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type CompetitionFormValues = z.infer<typeof competitionSchema>;

interface AddCompetitionDialogProps {
  onCompetitionAdded?: () => void;
}

export function AddCompetitionDialog({ onCompetitionAdded }: AddCompetitionDialogProps) {
  const [open, setOpen] = useState(false);
  const createCompetitionMutation = useCreateCompetitionWithParticipants();
  const { toast } = useToast();

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      entry_fee: '',
      prize_pool: '',
      max_participants: '',
      level: [],
      participants: [],
    },
  });

  // Watch category changes to reset levels
  const selectedCategory = form.watch('category');
  const selectedLevels = form.watch('level');
  
  // Fetch athletes based on selected category and levels
  const { data: athletes = [], isLoading: athletesLoading } = useAthletesByCategory(
    selectedCategory, 
    selectedLevels
  );

  const onSubmit = async (values: CompetitionFormValues) => {
    try {
      const competitionData = {
        name: values.name,
        description: values.description || null,
        location: values.location,
        start_date: values.start_date.toISOString().split('T')[0],
        end_date: values.end_date.toISOString().split('T')[0],
        category: values.category || null,
        level: values.level && values.level.length > 0 ? values.level[0] as any : null,
        entry_fee: values.entry_fee ? parseFloat(values.entry_fee) : null,
        prize_pool: values.prize_pool ? parseFloat(values.prize_pool) : null,
        max_participants: values.max_participants ? parseInt(values.max_participants) : null,
        registration_deadline: values.registration_deadline ? 
          values.registration_deadline.toISOString().split('T')[0] : null,
        status: 'upcoming' as const,
      };

      await createCompetitionMutation.mutateAsync({
        competition: competitionData,
        participants: values.participants || []
      });

      form.reset();
      setOpen(false);
      onCompetitionAdded?.();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Error creating competition:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="argon-gradient-blue text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          New Competition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Competition</DialogTitle>
          <DialogDescription>
            Add a new competition to the system. Fill in the required details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competition Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter competition name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter competition description" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick an end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset levels when category changes
                        form.setValue('level', []);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {selectedCategory && LEVEL_OPTIONS[selectedCategory as keyof typeof LEVEL_OPTIONS] ? (
                          LEVEL_OPTIONS[selectedCategory as keyof typeof LEVEL_OPTIONS].map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={option.value}
                                checked={field.value?.includes(option.value) || false}
                                onCheckedChange={(checked) => {
                                  const updatedLevels = checked
                                    ? [...(field.value || []), option.value]
                                    : (field.value || []).filter((value) => value !== option.value);
                                  field.onChange(updatedLevels);
                                }}
                              />
                              <label
                                htmlFor={option.value}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Please select a category first
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="entry_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Fee (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prize_pool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Pool (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="No limit"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="registration_deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Registration Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick registration deadline (optional)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Participants Selection */}
            <FormField
              control={form.control}
              name="participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participants</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {selectedCategory ? (
                        athletesLoading ? (
                          <p className="text-sm text-muted-foreground">Loading athletes...</p>
                        ) : athletes.length > 0 ? (
                          <>
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground">
                                {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} found in {selectedCategory}
                                {selectedLevels && selectedLevels.length > 0 && ` (${selectedLevels.join(', ')})`}
                              </p>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
                              {athletes.map((athlete) => (
                                <div key={athlete.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={athlete.id}
                                    checked={field.value?.includes(athlete.id) || false}
                                    onCheckedChange={(checked) => {
                                      const updatedParticipants = checked
                                        ? [...(field.value || []), athlete.id]
                                        : (field.value || []).filter((id) => id !== athlete.id);
                                      field.onChange(updatedParticipants);
                                    }}
                                  />
                                  <label
                                    htmlFor={athlete.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                  >
                                    {athlete.first_name} {athlete.last_name}
                                    <span className="text-muted-foreground ml-2">
                                      ({athlete.level})
                                    </span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No athletes found in the selected category and level(s)
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Please select a category to view available athletes
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createCompetitionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCompetitionMutation.isPending}
                className="argon-gradient-blue text-white hover:opacity-90"
              >
                {createCompetitionMutation.isPending ? 'Creating...' : 'Create Competition'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}