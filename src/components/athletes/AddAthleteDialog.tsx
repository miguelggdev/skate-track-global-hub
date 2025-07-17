import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  calculateAge, 
  getCategoryFromAge, 
  getLevelFromCategoryAndAge,
  getCategoryDisplayName,
  getLevelDisplayName
} from '@/utils/ageCalculations';

interface AddAthleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAthleteAdded: () => void;
}

interface AthleteFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date | undefined;
}

const AddAthleteDialog = ({ open, onOpenChange, onAthleteAdded }: AddAthleteDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [calculatedCategory, setCalculatedCategory] = useState<string>('');
  const [calculatedLevel, setCalculatedLevel] = useState<string>('');

  const form = useForm<AthleteFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: undefined,
    },
  });

  const dateOfBirth = form.watch('dateOfBirth');

  // Calculate age, category, and level when date of birth changes
  useEffect(() => {
    if (dateOfBirth) {
      const age = calculateAge(dateOfBirth);
      const category = getCategoryFromAge(age);
      const level = getLevelFromCategoryAndAge(category, age);
      
      setCalculatedAge(age);
      setCalculatedCategory(category);
      setCalculatedLevel(level);
    } else {
      setCalculatedAge(null);
      setCalculatedCategory('');
      setCalculatedLevel('');
    }
  }, [dateOfBirth]);

  const onSubmit = async (data: AthleteFormData) => {
    if (!data.dateOfBirth) {
      toast.error('Date of birth is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the athlete record with personal information
      const { error: athleteError } = await supabase
        .from('athletes')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          date_of_birth: format(data.dateOfBirth, 'yyyy-MM-dd'),
          category: calculatedCategory as any,
          level: calculatedLevel as any,
          status: 'active',
          performance_score: 0
        });

      if (athleteError) {
        console.error('Error creating athlete:', athleteError);
        throw athleteError;
      }

      // Notify parent component to refresh data
      onAthleteAdded();
      
      // Show success message
      toast.success('Athlete added successfully!');
      
      // Reset form and close dialog
      form.reset();
      setCalculatedAge(null);
      setCalculatedCategory('');
      setCalculatedLevel('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding athlete:', error);
      toast.error('Failed to add athlete. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Atleta</DialogTitle>
          <DialogDescription>
            Ingrese la información del atleta. La categoría y nivel se calcularán automáticamente según la fecha de nacimiento.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              rules={{ required: 'El nombre es requerido' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del atleta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              rules={{ required: 'El apellido es requerido' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el apellido del atleta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Dirección de email inválida'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ingrese el email del atleta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              rules={{ required: 'La fecha de nacimiento es requerida' }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
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
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Seleccionar fecha</span>
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
                          date > new Date() || date < new Date("1900-01-01")
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

            {/* Calculated Age, Category, and Level Display */}
            {calculatedAge !== null && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium">Información Calculada:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Edad:</span>
                    <p className="font-medium">{calculatedAge} años</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoría:</span>
                    <p className="font-medium">{getCategoryDisplayName(calculatedCategory)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nivel:</span>
                    <p className="font-medium">{getLevelDisplayName(calculatedLevel)}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !dateOfBirth}>
                {isSubmitting ? 'Agregando...' : 'Agregar Atleta'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAthleteDialog;