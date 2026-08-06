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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import DatePickerWithYearMonth from '@/components/ui/date-picker-with-year-month';
import { useCreateUser, CreateUserData } from '@/hooks/useCreateUser';

const addAthleteSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  idType: z.string().min(1, 'El tipo de identificación es requerido'),
  idNumber: z.string().min(1, 'El número de identificación es requerido'),
  email: z.string().min(1, 'El email es requerido').email('Dirección de email inválida'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  dateOfBirth: z.date({ required_error: 'La fecha de nacimiento es requerida' }),
  gender: z.string().min(1, 'El género es requerido'),
});

type AthleteFormData = z.infer<typeof addAthleteSchema>;

interface AddAthleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAthleteAdded: () => void;
}

const AddAthleteDialog = ({ open, onOpenChange, onAthleteAdded }: AddAthleteDialogProps) => {
  const { createUser, loading } = useCreateUser();

  const form = useForm<AthleteFormData>({
    resolver: zodResolver(addAthleteSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      idType: '',
      idNumber: '',
      email: '',
      password: '',
      dateOfBirth: undefined as unknown as Date,
      gender: '',
    },
  });

  const dateOfBirth = form.watch('dateOfBirth');

  const calculatedAge = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const calculatedCategory = calculatedAge != null ? getCategoryFromAge(calculatedAge) : null;
  const calculatedLevel = (calculatedAge != null && calculatedCategory)
    ? getLevelFromCategoryAndAge(calculatedCategory, calculatedAge)
    : null;

  const onSubmit = async (data: AthleteFormData) => {
    const createUserData: CreateUserData = {
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      id_type: data.idType,
      id_number: data.idNumber,
      role: 'athlete',
      date_of_birth: format(data.dateOfBirth, 'yyyy-MM-dd'),
      gender: data.gender,
    };

    const result = await createUser(createUserData);

    if (result.success) {
      form.reset();
      onOpenChange(false);
      onAthleteAdded();
      toast.success('Atleta creado exitosamente con cuenta de acceso');
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
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Identificación</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de identificación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Tarjeta de identidad">Tarjeta de identidad</SelectItem>
                      <SelectItem value="Cedula de Ciudadania">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                      <SelectItem value="Cedula de Extranjeria">Cédula de Extranjería</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Identificación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el número de identificación" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Contraseña para acceso del atleta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el género" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
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
                      <DatePickerWithYearMonth
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <p className="font-medium">{calculatedCategory ? getCategoryDisplayName(calculatedCategory) : '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nivel:</span>
                    <p className="font-medium">{calculatedLevel ? getLevelDisplayName(calculatedLevel) : '—'}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !dateOfBirth}>
                {loading ? 'Creando...' : 'Crear Atleta'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAthleteDialog;
