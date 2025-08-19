import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Clock, Users, Target, Activity, MapPin, Calendar as CalendarIcon, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateTrainingDialogProps {
  children: React.ReactNode;
}

interface TrainingType {
  value: 'technical' | 'physical' | 'mental' | 'recovery' | 'gym' | 'road_skating' | 'track_skating' | 'bicycle' | 'static_bicycle' | 'simulator';
  label: string;
  icon: any;
  description?: string;
}

const CreateTrainingDialog = ({ children }: CreateTrainingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const { toast } = useToast();
  const { profile, isAdmin, isCoach, loading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();

  console.log('CreateTrainingDialog: Component initialized', { 
    isAdmin, 
    isCoach, 
    userRole: profile?.role,
    profileLoading,
    profileExists: !!profile 
  });

  // Authentication guard - prevent opening if not authenticated or not authorized
  const canCreateTraining = (isAdmin || isCoach) && profile;
  
  console.log('CreateTrainingDialog: Permission check', {
    canCreateTraining,
    hasProfile: !!profile,
    isAuthenticated: !profileLoading && !!profile,
    isAdmin,
    isCoach
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date(),
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
    training_type: '',
    category: '',
    level: '',
    coach_id: ''
  });

  const [selectedDay, setSelectedDay] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Array<{id: string, name: string}>>([]);

  // Fetch coaches for admin users
  useEffect(() => {
    const fetchCoaches = async () => {
      if (!isAdmin || !open) return;
      
      console.log('CreateTrainingDialog: Fetching coaches for admin user');
      
      setCoachesLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('coaches')
          .select(`
            id,
            user_id,
            profiles:user_id (first_name, last_name)
          `);
        
        console.log('CreateTrainingDialog: Coaches fetched', { data, error: fetchError });
        
        if (fetchError) {
          console.error('CreateTrainingDialog: Error fetching coaches:', fetchError);
          setError('No se pudieron cargar los entrenadores');
          setCoaches([]);
          return;
        }
        
        if (data && data.length > 0) {
          const coachOptions = data.map(coach => ({
            id: coach.id,
            name: coach.profiles ? `${coach.profiles.first_name} ${coach.profiles.last_name}`.trim() : 'Coach'
          }));
          setCoaches(coachOptions);
          console.log('CreateTrainingDialog: Coaches set successfully:', coachOptions);
        } else {
          console.log('CreateTrainingDialog: No coaches found in database');
          setCoaches([]);
        }
      } catch (err) {
        console.error('CreateTrainingDialog: Unexpected error fetching coaches:', err);
        setError('Error inesperado al cargar entrenadores');
        setCoaches([]);
      } finally {
        setCoachesLoading(false);
      }
    };

    fetchCoaches();
  }, [open, isAdmin]);

  // Training types based on category and level
  const getTrainingTypes = (category: string, level: string): TrainingType[] => {
    const baseTypes: TrainingType[] = [
      { value: 'technical', label: 'Técnica', icon: Target },
      { value: 'physical', label: 'Físico', icon: Activity },
      { value: 'mental', label: 'Mental', icon: Users },
      { value: 'recovery', label: 'Recuperación', icon: Clock },
      { value: 'gym', label: 'Gimnasio', icon: Activity },
      { value: 'road_skating', label: 'Patinaje en Ruta', icon: MapPin },
      { value: 'track_skating', label: 'Patinaje en Pista', icon: Target },
      { value: 'bicycle', label: 'Bicicleta', icon: Activity },
      { value: 'static_bicycle', label: 'Bicicleta Estática', icon: Activity },
      { value: 'simulator', label: 'Simulador', icon: Target }
    ];

    // Customize training focus based on category and level
    if (category === 'youth') {
      if (level === 'escuela_menores') {
        return [
          { value: 'technical', label: 'Técnica Básica', icon: Target, description: 'Fundamentos y postura' },
          { value: 'physical', label: 'Acondicionamiento Lúdico', icon: Activity, description: 'Ejercicios divertidos' },
          { value: 'mental', label: 'Concentración', icon: Users, description: 'Atención y disciplina' }
        ];
      }
      return [
        { value: 'technical', label: 'Técnica Juvenil', icon: Target, description: 'Perfeccionamiento técnico' },
        { value: 'physical', label: 'Desarrollo Físico', icon: Activity, description: 'Fuerza y resistencia' },
        { value: 'mental', label: 'Confianza', icon: Users, description: 'Autoestima deportiva' }
      ];
    }

    if (category === 'junior') {
      return [
        { value: 'technical', label: 'Técnica Avanzada', icon: Target, description: 'Refinamiento técnico' },
        { value: 'physical', label: 'Preparación Física', icon: Activity, description: 'Potencia y velocidad' },
        { value: 'mental', label: 'Estrategia', icon: Users, description: 'Táctica competitiva' },
        { value: 'recovery', label: 'Recuperación', icon: Clock, description: 'Descanso activo' }
      ];
    }

    if (category === 'senior') {
      return [
        { value: 'technical', label: 'Técnica Competitiva', icon: Target, description: 'Precisión y eficiencia' },
        { value: 'physical', label: 'Alto Rendimiento', icon: Activity, description: 'Máximo potencial' },
        { value: 'mental', label: 'Presión Competitiva', icon: Users, description: 'Manejo del estrés' },
        { value: 'recovery', label: 'Recuperación Activa', icon: Clock, description: 'Prevención lesiones' }
      ];
    }

    if (category === 'masters') {
      return [
        { value: 'technical', label: 'Técnica Adaptada', icon: Target, description: 'Eficiencia de movimiento' },
        { value: 'physical', label: 'Mantenimiento', icon: Activity, description: 'Preservar condición' },
        { value: 'mental', label: 'Motivación', icon: Users, description: 'Disfrute del deporte' },
        { value: 'recovery', label: 'Recuperación', icon: Clock, description: 'Cuidado articular' }
      ];
    }

    return baseTypes;
  };

  const days = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  const categories = [
    { value: 'youth', label: 'Menores' },
    { value: 'junior', label: 'Juvenil' },
    { value: 'senior', label: 'Mayores' },
    { value: 'masters', label: 'Masters' }
  ];

  const levels = [
    { value: 'escuela_menores', label: 'Escuela Menores' },
    { value: 'transicion', label: 'Transición' },
    { value: 'mayores', label: 'Mayores' }
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  const addToWeeklySchedule = () => {
    if (!selectedDay || !formData.start_time || !formData.end_time || !formData.training_type) {
      toast({
        title: "Error",
        description: "Completa todos los campos para agregar al horario semanal",
        variant: "destructive"
      });
      return;
    }

    // Calculate the actual date for the selected day within the week
    const selectedDate = new Date(formData.date);
    const dayOfWeek = days.findIndex(d => d.value === selectedDay);
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + dayOfWeek);

    const newScheduleItem = {
      day: selectedDay,
      date: startOfWeek.toISOString().split('T')[0],
      start_time: formData.start_time,
      end_time: formData.end_time,
      training_type: formData.training_type as 'technical' | 'physical' | 'mental' | 'recovery',
      category: formData.category,
      level: formData.level,
      max_participants: formData.max_participants,
      location: formData.location,
      coach_id: formData.coach_id
    };

    setWeeklySchedule([...weeklySchedule, newScheduleItem]);
    
    // Reset form for next entry
    setFormData({
      ...formData,
      start_time: '',
      end_time: '',
      training_type: ''
    });
    setSelectedDay('');
  };

  const removeFromSchedule = (index: number) => {
    setWeeklySchedule(weeklySchedule.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (weeklySchedule.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un horario a la programación semanal",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let coachId = null;

      if (isAdmin) {
        // Admin can assign specific coach or leave unassigned
        coachId = formData.coach_id === 'unassigned' || !formData.coach_id ? null : formData.coach_id;
      } else if (isCoach) {
        // Coach must use their own profile
        const { data: coach } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!coach) throw new Error('Perfil de entrenador no encontrado');
        coachId = coach.id;
      } else {
        throw new Error('No tienes permisos para crear entrenamientos');
      }

      // Create training sessions for each item in weekly schedule
      const trainingPromises = weeklySchedule.map(async (item) => {
        const trainingTypes = getTrainingTypes(item.category, item.level);
        const selectedType = trainingTypes.find(t => t.value === item.training_type);

        return supabase.from('training_sessions').insert({
          coach_id: (item.coach_id === 'unassigned' || !item.coach_id) ? coachId : item.coach_id,
          name: `${selectedType?.label} - ${categories.find(c => c.value === item.category)?.label} ${levels.find(l => l.value === item.level)?.label}`,
          description: selectedType?.description || formData.description || '',
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          location: item.location || null,
          max_participants: item.max_participants ? parseInt(item.max_participants) : null,
          training_type: item.training_type
        });
      });

      await Promise.all(trainingPromises);

      // Invalidate training sessions cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });

      toast({
        title: "Éxito",
        description: `Se crearon ${weeklySchedule.length} entrenamientos programados`,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        date: new Date(),
        start_time: '',
        end_time: '',
        location: '',
        max_participants: '',
        training_type: '',
        category: '',
        level: '',
        coach_id: ''
      });
      setWeeklySchedule([]);
      setOpen(false);

    } catch (error) {
      console.error('Error creating training:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el entrenamiento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const trainingTypes = formData.category && formData.level 
    ? getTrainingTypes(formData.category, formData.level)
    : [];

  console.log('CreateTrainingDialog: Rendering dialog', {
    open,
    profileLoading,
    canCreateTraining,
    profile: !!profile,
    error
  });

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('CreateTrainingDialog: Dialog open change requested', { 
        newOpen, 
        canCreateTraining, 
        profileLoading,
        profile: !!profile 
      });
      
      // Prevent opening if user is not authenticated or authorized
      if (newOpen && !canCreateTraining) {
        console.log('CreateTrainingDialog: Preventing dialog open - user not authorized', {
          profileLoading,
          hasProfile: !!profile,
          isAdmin,
          isCoach
        });
        
        if (profileLoading) {
          toast({
            title: "Cargando...",
            description: "Por favor espera mientras verificamos tus permisos",
            variant: "default"
          });
          return;
        }
        
        if (!profile) {
          toast({
            title: "No autenticado",
            description: "Debes iniciar sesión para crear entrenamientos",
            variant: "destructive"
          });
          return;
        }
        
        if (!isAdmin && !isCoach) {
          toast({
            title: "Sin permisos",
            description: "Solo administradores y entrenadores pueden crear entrenamientos",
            variant: "destructive"
          });
          return;
        }
      }
      
      console.log('CreateTrainingDialog: Setting open to', newOpen);
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Programación de Entrenamientos
          </DialogTitle>
          <DialogDescription>
            Crea una programación semanal de entrenamientos adaptados por categoría y nivel
          </DialogDescription>
        </DialogHeader>

        {/* Show loading state while profile is loading */}
        {profileLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Verificando permisos...</p>
            </div>
          </div>
        )}

        {/* Show error message if there's an error */}
        {error && !profileLoading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Debug information - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Profile Loading: {profileLoading.toString()}</p>
            <p>Has Profile: {(!!profile).toString()}</p>
            <p>Is Admin: {isAdmin.toString()}</p>
            <p>Is Coach: {isCoach.toString()}</p>
            <p>Can Create Training: {canCreateTraining.toString()}</p>
            <p>Error: {error || 'None'}</p>
          </div>
        )}

        {/* Show main form only if user is authorized and not loading */}
        {!profileLoading && canCreateTraining && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Fecha de Programación</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => setFormData({...formData, date: date || new Date()})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="level">Nivel</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map(level => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Ej: Pista principal, Gimnasio..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_participants">Máximo Participantes</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                      placeholder="Ej: 15"
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <Label htmlFor="coach_id">Entrenador Asignado</Label>
                      <Select value={formData.coach_id} onValueChange={(value) => setFormData({...formData, coach_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar entrenador (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Sin asignar</SelectItem>
                          {coaches.map(coach => (
                            <SelectItem key={coach.id} value={coach.id}>{coach.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descripción General</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descripción general de la programación..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Training Types Available */}
            {trainingTypes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tipos de Entrenamiento Disponibles</CardTitle>
                  <CardDescription>
                    Entrenamientos adaptados para {categories.find(c => c.value === formData.category)?.label} - {levels.find(l => l.value === formData.level)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trainingTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <type.icon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Programación Semanal</CardTitle>
                <CardDescription>Agrega entrenamientos para cada día de la semana</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Día</Label>
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="Día" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map(day => (
                          <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Hora Inicio</Label>
                    <Select value={formData.start_time} onValueChange={(value) => setFormData({...formData, start_time: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Inicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Hora Fin</Label>
                    <Select value={formData.end_time} onValueChange={(value) => setFormData({...formData, end_time: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Fin" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Select value={formData.training_type} onValueChange={(value) => setFormData({...formData, training_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button type="button" onClick={addToWeeklySchedule} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Visual Weekly Calendar */}
                {weeklySchedule.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Programación Visual Semanal:</Label>
                    
                    {/* Calendar Header */}
                    <div className="bg-yellow-400 text-black p-3 text-center font-bold text-sm border border-gray-800">
                      PROGRAMACIÓN DE ENTRENAMIENTO SEMANA {format(formData.date, 'dd/MM')} - {format(new Date(formData.date.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd/MM')} {format(formData.date, 'MMMM yyyy')}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="border border-gray-800 bg-white">
                      {/* Days Header */}
                      <div className="grid grid-cols-8 bg-green-200">
                        <div className="p-3 border border-gray-800 text-center font-bold text-xs bg-green-300">JORNADA</div>
                        {days.map(day => (
                          <div key={day.value} className="p-3 border border-gray-800 text-center font-bold text-xs bg-green-200">
                            {day.label.toUpperCase()}
                          </div>
                        ))}
                      </div>
                      
                      {/* AM Row */}
                      <div className="grid grid-cols-8">
                        <div className="p-4 border border-gray-800 bg-green-100 font-bold text-center text-sm flex items-center justify-center min-h-[80px]">
                          AM
                        </div>
                        {days.map(day => {
                          const amTrainings = weeklySchedule.filter(item => 
                            item.day === day.value && 
                            parseInt(item.start_time.split(':')[0]) < 12
                          );
                          
                          // Calculate the actual date for this day
                          const selectedDate = new Date(formData.date);
                          const dayOfWeek = days.findIndex(d => d.value === day.value);
                          const dayDate = new Date(selectedDate);
                          dayDate.setDate(selectedDate.getDate() - selectedDate.getDay() + dayOfWeek);
                          const dayNumber = dayDate.getDate();
                          
                          return (
                            <div key={day.value} className="border border-gray-800 p-2 bg-gray-50 min-h-[80px] flex flex-col justify-start">
                              <div className="text-xs text-center font-bold text-gray-600 mb-1">
                                {dayNumber}
                              </div>
                              {amTrainings.length > 0 ? (
                                amTrainings.map((training, idx) => {
                                  const typeColor = training.training_type === 'technical' ? 'bg-blue-500' :
                                                  training.training_type === 'physical' ? 'bg-red-500' :
                                                  training.training_type === 'mental' ? 'bg-purple-500' : 'bg-green-500';
                                  
                                  return (
                                    <div key={idx} className={`text-xs text-center font-semibold text-white p-1 rounded mb-1 ${typeColor}`}>
                                      <div>{training.start_time}</div>
                                      <div className="text-xs">{training.location || 'Gym'}</div>
                                    </div>
                                  );
                                })
                              ) : (
                                day.value === 'sunday' ? (
                                  <div className="text-xs text-center text-gray-600 italic mt-4">
                                    Descanso
                                  </div>
                                ) : null
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* PM Row */}
                      <div className="grid grid-cols-8">
                        <div className="p-4 border border-gray-800 bg-green-100 font-bold text-center text-sm flex items-center justify-center min-h-[80px]">
                          PM
                        </div>
                        {days.map(day => {
                          const pmTrainings = weeklySchedule.filter(item => 
                            item.day === day.value && 
                            parseInt(item.start_time.split(':')[0]) >= 12 &&
                            parseInt(item.start_time.split(':')[0]) < 18
                          );
                          return (
                            <div key={day.value} className="border border-gray-800 p-2 bg-gray-50 min-h-[80px] flex flex-col justify-start">
                              {pmTrainings.map((training, idx) => {
                                const typeColor = training.training_type === 'technical' ? 'bg-blue-500' :
                                                training.training_type === 'physical' ? 'bg-red-500' :
                                                training.training_type === 'mental' ? 'bg-purple-500' : 'bg-green-500';
                                
                                return (
                                  <div key={idx} className={`text-xs text-center text-white p-1 rounded mb-1 ${typeColor}`}>
                                    <div className="font-semibold">
                                      {training.start_time} - {training.end_time}
                                    </div>
                                    <div className="text-xs">
                                      {training.location || 'Club'}
                                    </div>
                                    <div className="text-xs opacity-90">
                                      {trainingTypes.find(t => t.value === training.training_type)?.label}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Evening Row */}
                      <div className="grid grid-cols-8">
                        <div className="p-4 border border-gray-800 bg-green-100 font-bold text-center text-sm flex items-center justify-center min-h-[80px]">
                        </div>
                        {days.map(day => {
                          const eveningTrainings = weeklySchedule.filter(item => 
                            item.day === day.value && 
                            parseInt(item.start_time.split(':')[0]) >= 18
                          );
                          return (
                            <div key={day.value} className="border border-gray-800 p-2 bg-gray-50 min-h-[80px] flex flex-col justify-start">
                              {eveningTrainings.map((training, idx) => {
                                const typeColor = training.training_type === 'technical' ? 'bg-blue-500' :
                                                training.training_type === 'physical' ? 'bg-red-500' :
                                                training.training_type === 'mental' ? 'bg-purple-500' : 'bg-green-500';
                                
                                const levelText = training.level === 'escuela_menores' ? 'Escuela Menores' : 
                                                 training.level === 'transicion' ? 'Transición' : 'Mayores';
                                
                                return (
                                  <div key={idx} className={`text-xs text-center text-white p-1 rounded mb-1 ${typeColor}`}>
                                    <div className="font-semibold">
                                      {training.start_time} - {training.end_time}
                                    </div>
                                    <div className="text-xs">
                                      {training.location || 'Club'}
                                    </div>
                                    <div className="text-xs opacity-90">
                                      {levelText}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-yellow-400 text-black p-3 text-center font-bold text-sm border border-gray-800">
                      Respeto / Amistad / Excelencia
                    </div>
                    <div className="bg-green-600 text-white p-3 text-center font-bold text-lg border border-gray-800">
                      AVIVASCLUB
                    </div>
                  </div>
                )}

                {/* Schedule List */}
                {weeklySchedule.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Lista de Entrenamientos:</Label>
                    {weeklySchedule.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-4">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="font-medium">
                            {days.find(d => d.value === item.day)?.label}
                          </span>
                          <Clock className="h-4 w-4" />
                          <span>{item.start_time} - {item.end_time}</span>
                          <Target className="h-4 w-4" />
                          <span>{trainingTypes.find(t => t.value === item.training_type)?.label}</span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromSchedule(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || weeklySchedule.length === 0}>
                {loading ? 'Creando...' : `Crear ${weeklySchedule.length} Entrenamientos`}
              </Button>
            </div>
          </form>
        )}

        {/* Show message for unauthorized users */}
        {!profileLoading && !canCreateTraining && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Acceso Restringido</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {!profile ? 
                    'Debes iniciar sesión para acceder a esta función.' :
                    'Solo administradores y entrenadores pueden crear entrenamientos.'
                  }
                </p>
              </div>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrainingDialog;