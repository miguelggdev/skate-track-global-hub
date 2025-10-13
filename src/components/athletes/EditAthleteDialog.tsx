import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAthleteDetails } from '@/hooks/useAthleteDetails';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, User } from 'lucide-react';
import { Athlete } from '@/hooks/useAthletes';
import { PhotoUpload } from '@/components/users/PhotoUpload';

// Form validation schema
const editAthleteSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  category: z.enum(['youth', 'junior', 'juvenil', 'senior', 'escuela', 'mayores', 'masters', 'menores', 'transicion', 'prejuvenil']),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'professional', 'escuela_menores', 'transicion', 'mayores', 'escuela', 'mini_infantil', 'pre_infantil', 'infantil', 'junior', 'pre_juvenil', 'prejuveniles', 'juvenil_primer_ano', 'juvenil_segundo_ano', 'juvenil_tercer_ano', 'mayores_unica']),
  status: z.enum(['active', 'inactive', 'injured', 'suspended']),
  gender: z.enum(['masculino', 'femenino']).optional(),
  id_type: z.enum(['Tarjeta de identidad', 'Cedula de Ciudadania', 'Pasaporte', 'Cedula de Extranjeria']).optional(),
  id_number: z.string().optional(),
  athlete_number: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_notes: z.string().optional(),
  achievements: z.string().optional(),
  performance_score: z.coerce.number().min(0).max(100).optional(),
  bio: z.string().optional(),
  // Family fields
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_email: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_relationship: z.string().optional(),
  guardian_phone: z.string().optional(),
  guardian_email: z.string().optional(),
  // Medical/Body fields
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  size: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  surgeries: z.string().optional(),
  injuries: z.string().optional(),
  limitations: z.string().optional(),
  // Studies fields
  education_level: z.string().optional(),
  current_grade: z.string().optional(),
  school_name: z.string().optional(),
  school_address: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().optional(),
  // Equipment fields
  boot_size: z.coerce.number().optional(),
  wheel_diameter: z.coerce.number().optional(),
  frame_size: z.string().optional(),
  boot_brand: z.string().optional(),
  frame_brand: z.string().optional(),
  track_wheels_brand: z.string().optional(),
  helmet_brand: z.string().optional(),
  // History fields
  years_experience: z.coerce.number().optional(),
  start_date: z.string().optional(),
  league_date: z.string().optional(),
  federation_date: z.string().optional(),
  is_league: z.boolean().optional(),
  is_federated: z.boolean().optional(),
  previous_club: z.string().optional(),
});

type EditAthleteFormData = z.infer<typeof editAthleteSchema>;

interface EditAthleteDialogProps {
  athlete: Athlete | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAthleteUpdated: () => void;
}

export const EditAthleteDialog = ({ athlete, open, onOpenChange, onAthleteUpdated }: EditAthleteDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch detailed athlete data for form population
  const { data: athleteDetails } = useAthleteDetails(athlete?.id || null);

  const form = useForm<EditAthleteFormData>({
    resolver: zodResolver(editAthleteSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      category: 'escuela',
      level: 'beginner',
      status: 'active',
      gender: 'masculino',
      id_type: 'Tarjeta de identidad',
      id_number: '',
      athlete_number: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_notes: '',
      achievements: '',
      performance_score: 0,
      bio: '',
      // Family defaults
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      guardian_name: '',
      guardian_relationship: '',
      guardian_phone: '',
      guardian_email: '',
      // Medical/Body defaults
      weight: undefined,
      height: undefined,
      size: '',
      blood_type: '',
      allergies: '',
      surgeries: '',
      injuries: '',
      limitations: '',
      // Studies defaults
      education_level: '',
      current_grade: '',
      school_name: '',
      school_address: '',
      school_phone: '',
      school_email: '',
      // Equipment defaults
      boot_size: undefined,
      wheel_diameter: undefined,
      frame_size: '',
      boot_brand: '',
      frame_brand: '',
      track_wheels_brand: '',
      helmet_brand: '',
      // History defaults
      years_experience: undefined,
      start_date: '',
      league_date: '',
      federation_date: '',
      is_league: false,
      is_federated: false,
      previous_club: '',
    },
  });

  // Reset form when athlete details change
  useEffect(() => {
    if (athleteDetails) {
      // Set photo URL from profile
      setPhotoUrl(athleteDetails.avatar_url || null);
      
      form.reset({
        first_name: athleteDetails.first_name || '',
        last_name: athleteDetails.last_name || '',
        email: athleteDetails.email || '',
        phone: athleteDetails.phone || '',
        date_of_birth: athleteDetails.date_of_birth || '',
        category: athleteDetails.category as any,
        level: athleteDetails.level as any,
        status: athleteDetails.status as any,
        gender: athleteDetails.gender as any || 'masculino',
        id_type: athleteDetails.id_type as any || 'Tarjeta de identidad',
        id_number: athleteDetails.id_number || '',
        athlete_number: athleteDetails.athlete_number || '',
        emergency_contact_name: athleteDetails.emergency_contact_name || '',
        emergency_contact_phone: athleteDetails.emergency_contact_phone || '',
        medical_notes: athleteDetails.medical_notes || '',
        achievements: athleteDetails.achievements || '',
        performance_score: athleteDetails.performance_score || 0,
        bio: athleteDetails.bio || '',
        // Family data
        parent_name: athleteDetails.family?.parent_name || '',
        parent_phone: athleteDetails.family?.parent_phone || '',
        parent_email: athleteDetails.family?.parent_email || '',
        guardian_name: athleteDetails.family?.guardian_name || '',
        guardian_relationship: athleteDetails.family?.guardian_relationship || '',
        guardian_phone: athleteDetails.family?.guardian_phone || '',
        guardian_email: athleteDetails.family?.guardian_email || '',
        // Medical/Body data
        weight: athleteDetails.body_info?.weight || undefined,
        height: athleteDetails.body_info?.height || undefined,
        size: athleteDetails.body_info?.size || '',
        blood_type: athleteDetails.body_info?.blood_type || '',
        allergies: athleteDetails.body_info?.allergies || '',
        surgeries: athleteDetails.body_info?.surgeries || '',
        injuries: athleteDetails.body_info?.injuries || '',
        limitations: athleteDetails.body_info?.limitations || '',
        // Studies data
        education_level: athleteDetails.studies?.education_level || '',
        current_grade: athleteDetails.studies?.current_grade || '',
        school_name: athleteDetails.studies?.school_name || '',
        school_address: athleteDetails.studies?.school_address || '',
        school_phone: athleteDetails.studies?.school_phone || '',
        school_email: athleteDetails.studies?.school_email || '',
        // Equipment data
        boot_size: athleteDetails.equipment?.boot_size || undefined,
        wheel_diameter: athleteDetails.equipment?.wheel_diameter || undefined,
        frame_size: athleteDetails.equipment?.frame_size || '',
        boot_brand: athleteDetails.equipment?.boot_brand || '',
        frame_brand: athleteDetails.equipment?.frame_brand || '',
        track_wheels_brand: athleteDetails.equipment?.track_wheels_brand || '',
        helmet_brand: athleteDetails.equipment?.helmet_brand || '',
        // History data
        years_experience: athleteDetails.history?.years_experience || undefined,
        start_date: athleteDetails.history?.start_date || '',
        league_date: athleteDetails.history?.league_date || '',
        federation_date: athleteDetails.history?.federation_date || '',
        is_league: athleteDetails.history?.is_league || false,
        is_federated: athleteDetails.history?.is_federated || false,
        previous_club: athleteDetails.history?.previous_club || '',
      });
    }
  }, [athleteDetails, form]);

  const onSubmit = async (data: EditAthleteFormData) => {
    if (!athlete) return;

    setIsLoading(true);
    try {
      // Update athlete record
      const { error: athleteError } = await supabase
        .from('athletes')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          category: data.category,
          level: data.level,
          status: data.status,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          medical_notes: data.medical_notes,
          achievements: data.achievements,
          performance_score: data.performance_score,
          athlete_number: data.athlete_number,
          gender: data.gender,
          date_of_birth: data.date_of_birth || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', athlete.id);

      if (athleteError) throw athleteError;

      // Update profile record if user_id exists
      if (athlete.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            date_of_birth: data.date_of_birth || null,
            id_type: data.id_type,
            id_number: data.id_number,
            bio: data.bio,
            updated_at: new Date().toISOString(),
          })
          .eq('id', athlete.user_id);

        if (profileError) throw profileError;
      }

      // Update or insert family data - check if exists first
      const { data: existingFamily } = await supabase
        .from('athlete_family')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const familyData = {
        athlete_id: athlete.id,
        parent_name: data.parent_name,
        parent_phone: data.parent_phone,
        parent_email: data.parent_email,
        guardian_name: data.guardian_name,
        guardian_relationship: data.guardian_relationship,
        guardian_phone: data.guardian_phone,
        guardian_email: data.guardian_email,
        updated_at: new Date().toISOString(),
      };

      if (existingFamily) {
        const { error: familyError } = await supabase
          .from('athlete_family')
          .update(familyData)
          .eq('id', existingFamily.id);
        if (familyError) throw familyError;
      } else {
        const { error: familyError } = await supabase
          .from('athlete_family')
          .insert(familyData);
        if (familyError) throw familyError;
      }

      // Update or insert body info - has unique constraint, can use onConflict
      const { error: bodyError } = await supabase
        .from('athlete_body_info')
        .upsert({
          athlete_id: athlete.id,
          weight: data.weight,
          height: data.height,
          size: data.size,
          blood_type: data.blood_type,
          allergies: data.allergies,
          surgeries: data.surgeries,
          injuries: data.injuries,
          limitations: data.limitations,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'athlete_id' });

      if (bodyError) throw bodyError;

      // Update or insert studies data - check if exists first
      const { data: existingStudies } = await supabase
        .from('athlete_studies')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const studiesData = {
        athlete_id: athlete.id,
        education_level: data.education_level,
        current_grade: data.current_grade,
        school_name: data.school_name,
        school_address: data.school_address,
        school_phone: data.school_phone,
        school_email: data.school_email,
        updated_at: new Date().toISOString(),
      };

      if (existingStudies) {
        const { error: studiesError } = await supabase
          .from('athlete_studies')
          .update(studiesData)
          .eq('id', existingStudies.id);
        if (studiesError) throw studiesError;
      } else {
        const { error: studiesError } = await supabase
          .from('athlete_studies')
          .insert(studiesData);
        if (studiesError) throw studiesError;
      }

      // Update or insert equipment data - check if exists first
      const { data: existingEquipment } = await supabase
        .from('athlete_equipment')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const equipmentData = {
        athlete_id: athlete.id,
        boot_size: data.boot_size,
        wheel_diameter: data.wheel_diameter,
        frame_size: data.frame_size,
        boot_brand: data.boot_brand,
        frame_brand: data.frame_brand,
        track_wheels_brand: data.track_wheels_brand,
        helmet_brand: data.helmet_brand,
        updated_at: new Date().toISOString(),
      };

      if (existingEquipment) {
        const { error: equipmentError } = await supabase
          .from('athlete_equipment')
          .update(equipmentData)
          .eq('id', existingEquipment.id);
        if (equipmentError) throw equipmentError;
      } else {
        const { error: equipmentError } = await supabase
          .from('athlete_equipment')
          .insert(equipmentData);
        if (equipmentError) throw equipmentError;
      }

      // Update or insert history data - check if exists first
      const { data: existingHistory } = await supabase
        .from('athlete_history')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const historyData = {
        athlete_id: athlete.id,
        years_experience: data.years_experience,
        start_date: data.start_date || null,
        league_date: data.league_date || null,
        federation_date: data.federation_date || null,
        is_league: data.is_league,
        is_federated: data.is_federated,
        previous_club: data.previous_club,
        updated_at: new Date().toISOString(),
      };

      if (existingHistory) {
        const { error: historyError } = await supabase
          .from('athlete_history')
          .update(historyData)
          .eq('id', existingHistory.id);
        if (historyError) throw historyError;
      } else {
        const { error: historyError } = await supabase
          .from('athlete_history')
          .insert(historyData);
        if (historyError) throw historyError;
      }

      toast({
        title: "Atleta actualizado",
        description: "Los datos del atleta se han actualizado correctamente.",
      });

      onAthleteUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating athlete:', error);
      toast({
        title: "Error",
        description: error.message || 'No se pudo actualizar el atleta.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'youth': 'Juvenil',
      'junior': 'Junior',
      'juvenil': 'Juvenil',
      'senior': 'Senior',
      'escuela': 'Escuela',
      'mayores': 'Mayores',
      'masters': 'Masters',
      'menores': 'Menores',
      'transicion': 'Transición',
      'prejuvenil': 'Pre-juvenil',
    };
    return labels[category] || category;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado',
      'professional': 'Profesional',
      'escuela': 'Escuela',
      'infantil': 'Infantil',
      'mayores': 'Mayores',
      'juvenil_primer_ano': 'Juvenil 1er Año',
      'juvenil_segundo_ano': 'Juvenil 2do Año',
      'juvenil_tercer_ano': 'Juvenil 3er Año',
      'mayores_unica': 'Mayores Única',
    };
    return labels[level] || level;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'injured': 'Lesionado',
      'suspended': 'Suspendido',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'injured': 'bg-red-100 text-red-800',
      'suspended': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!athlete) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Atleta
            <Badge className={getStatusColor(athlete.status)}>
              {getStatusLabel(athlete.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Modifica la información del atleta {athlete.first_name} {athlete.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <ScrollArea className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-0 min-w-max">
                  <TabsTrigger value="basic" className="px-2 text-xs">Básico</TabsTrigger>
                  <TabsTrigger value="personal" className="px-2 text-xs">Personal</TabsTrigger>
                  <TabsTrigger value="contact" className="px-2 text-xs">Contacto</TabsTrigger>
                  <TabsTrigger value="family" className="px-2 text-xs">Familia</TabsTrigger>
                  <TabsTrigger value="medical" className="px-2 text-xs">Médico</TabsTrigger>
                  <TabsTrigger value="studies" className="px-2 text-xs">Estudios</TabsTrigger>
                  <TabsTrigger value="equipment" className="px-2 text-xs">Equipo</TabsTrigger>
                  <TabsTrigger value="history" className="px-2 text-xs">Historial</TabsTrigger>
                </TabsList>
              </ScrollArea>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido *</FormLabel>
                        <FormControl>
                          <Input placeholder="Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['youth', 'junior', 'juvenil', 'senior', 'escuela', 'mayores', 'masters', 'menores', 'transicion', 'prejuvenil'].map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {getCategoryLabel(cat)}
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
                        <FormLabel>Nivel *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar nivel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['beginner', 'intermediate', 'advanced', 'professional', 'escuela', 'infantil', 'mayores', 'juvenil_primer_ano', 'juvenil_segundo_ano', 'juvenil_tercer_ano', 'mayores_unica'].map((lvl) => (
                              <SelectItem key={lvl} value={lvl}>
                                {getLevelLabel(lvl)}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['active', 'inactive', 'injured', 'suspended'].map((status) => (
                              <SelectItem key={status} value={status}>
                                {getStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="athlete_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Atleta</FormLabel>
                        <FormControl>
                          <Input placeholder="A001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="performance_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Puntuación de Rendimiento (0-100)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" placeholder="85" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                {/* Photo Upload Section */}
                {athlete?.user_id && (
                  <div className="border rounded-lg p-4 bg-muted/50 mb-4">
                    <PhotoUpload
                      currentPhotoUrl={photoUrl || athleteDetails?.avatar_url || undefined}
                      onPhotoChange={(url) => setPhotoUrl(url)}
                      userId={athlete.user_id}
                      className="max-w-md mx-auto"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                              <SelectValue placeholder="Seleccionar género" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Tarjeta de identidad">Tarjeta de Identidad</SelectItem>
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
                    name="id_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Documento</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678X" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+34 600 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contacto de Emergencia</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del contacto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergency_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de Emergencia</FormLabel>
                        <FormControl>
                          <Input placeholder="+34 600 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="family" className="space-y-4">
                <h4 className="font-medium mb-4">Información Familiar</h4>
                
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-muted-foreground">Padre/Madre</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="parent_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Padre/Madre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+34 600 000 000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <h5 className="text-sm font-medium text-muted-foreground">Tutor/Guardián</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardian_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Tutor</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardian_relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relación</FormLabel>
                          <FormControl>
                            <Input placeholder="Tío, abuelo, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardian_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+34 600 000 000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardian_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <h4 className="font-medium mb-4">Información Médica y Física</h4>
                
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-muted-foreground">Medidas Físicas</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="70" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altura (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="175" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Talla</FormLabel>
                          <FormControl>
                            <Input placeholder="M" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="blood_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Sangre</FormLabel>
                          <FormControl>
                            <Input placeholder="O+" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <h5 className="text-sm font-medium text-muted-foreground">Historial Médico</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alergias</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe alergias conocidas..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="surgeries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cirugías</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Historial de cirugías..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="injuries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesiones</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Lesiones previas..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="limitations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limitaciones</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Limitaciones físicas..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="medical_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Médicas Adicionales</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Información médica relevante..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="studies" className="space-y-4">
                <h4 className="font-medium mb-4">Información Académica</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="education_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel Educativo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar nivel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="preescolar">Preescolar</SelectItem>
                            <SelectItem value="primaria">Primaria</SelectItem>
                            <SelectItem value="secundaria">Secundaria</SelectItem>
                            <SelectItem value="bachillerato">Bachillerato</SelectItem>
                            <SelectItem value="universidad">Universidad</SelectItem>
                            <SelectItem value="posgrado">Posgrado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="current_grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grado Actual</FormLabel>
                        <FormControl>
                          <Input placeholder="5to grado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="school_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Centro Educativo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del colegio/universidad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="school_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección del Centro</FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección completa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="school_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono del Centro</FormLabel>
                        <FormControl>
                          <Input placeholder="+34 900 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="school_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email del Centro</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@colegio.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="equipment" className="space-y-4">
                <h4 className="font-medium mb-4">Equipamiento de Patinaje</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="boot_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Talla de Bota</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="42" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wheel_diameter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diámetro de Rueda (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="110" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frame_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Talla de Chasis</FormLabel>
                        <FormControl>
                          <Input placeholder="4x110" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="boot_brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca de Bota</FormLabel>
                        <FormControl>
                          <Input placeholder="Rollerblade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frame_brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca de Chasis</FormLabel>
                        <FormControl>
                          <Input placeholder="Powerslide" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="track_wheels_brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca de Ruedas</FormLabel>
                        <FormControl>
                          <Input placeholder="Matter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="helmet_brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca de Casco</FormLabel>
                        <FormControl>
                          <Input placeholder="Bontrager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <h4 className="font-medium mb-4">Historial Deportivo</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="years_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Años de Experiencia</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previous_club"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Club Anterior</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del club anterior" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio en el Deporte</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="league_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Ingreso a Liga</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federation_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Federación</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="is_league"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Participa en Liga</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_federated"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Está Federado</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="achievements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logros y Reconocimientos</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Logros y reconocimientos del atleta..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografía</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información adicional sobre el atleta..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Atleta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};