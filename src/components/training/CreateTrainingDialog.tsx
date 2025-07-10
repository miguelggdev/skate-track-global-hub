import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Clock, Users, Target, Activity, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateTrainingDialogProps {
  children: React.ReactNode;
}

interface TrainingType {
  value: 'technical' | 'physical' | 'mental' | 'recovery';
  label: string;
  icon: any;
  description?: string;
}

const CreateTrainingDialog = ({ children }: CreateTrainingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
    training_type: '',
    category: '',
    level: ''
  });

  const [selectedDay, setSelectedDay] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);

  // Training types based on category and level
  const getTrainingTypes = (category: string, level: string): TrainingType[] => {
    const baseTypes: TrainingType[] = [
      { value: 'technical', label: 'Técnica', icon: Target },
      { value: 'physical', label: 'Físico', icon: Activity },
      { value: 'mental', label: 'Mental', icon: Users },
      { value: 'recovery', label: 'Recuperación', icon: Clock }
    ];

    // Customize training focus based on category and level
    if (category === 'youth') {
      if (level === 'beginner') {
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
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' },
    { value: 'professional', label: 'Profesional' }
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

    const newScheduleItem = {
      day: selectedDay,
      start_time: formData.start_time,
      end_time: formData.end_time,
      training_type: formData.training_type as 'technical' | 'physical' | 'mental' | 'recovery',
      category: formData.category,
      level: formData.level,
      max_participants: formData.max_participants,
      location: formData.location
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
      // Get current user's coach profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coach) throw new Error('Perfil de entrenador no encontrado');

      // Create training sessions for each item in weekly schedule
      const trainingPromises = weeklySchedule.map(async (item) => {
        // Calculate date for next occurrence of this day
        const today = new Date();
        const dayOfWeek = days.findIndex(d => d.value === item.day);
        const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7 || 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntilTarget);

        const trainingTypes = getTrainingTypes(item.category, item.level);
        const selectedType = trainingTypes.find(t => t.value === item.training_type);

        return supabase.from('training_sessions').insert({
          coach_id: coach.id,
          name: `${selectedType?.label} - ${categories.find(c => c.value === item.category)?.label} ${levels.find(l => l.value === item.level)?.label}`,
          description: selectedType?.description || formData.description || '',
          date: targetDate.toISOString().split('T')[0],
          start_time: item.start_time,
          end_time: item.end_time,
          location: item.location || null,
          max_participants: item.max_participants ? parseInt(item.max_participants) : null,
          training_type: item.training_type
        });
      });

      await Promise.all(trainingPromises);

      toast({
        title: "Éxito",
        description: `Se crearon ${weeklySchedule.length} entrenamientos programados`,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        location: '',
        max_participants: '',
        training_type: '',
        category: '',
        level: ''
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Current Schedule */}
              {weeklySchedule.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Horario Programado:</Label>
                  {weeklySchedule.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-4 w-4" />
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
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromSchedule(index)}
                      >
                        Eliminar
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
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrainingDialog;