import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Athlete } from '@/hooks/useAthletes';
import { editAthleteSchema, EditAthleteFormData, STATUS_LABELS, STATUS_COLORS } from './edit-tabs/schema';
import { BasicTab } from './edit-tabs/BasicTab';
import { PersonalTab } from './edit-tabs/PersonalTab';
import { ContactTab } from './edit-tabs/ContactTab';
import { FamilyTab } from './edit-tabs/FamilyTab';
import { MedicalTab } from './edit-tabs/MedicalTab';
import { StudiesTab } from './edit-tabs/StudiesTab';
import { EquipmentTab } from './edit-tabs/EquipmentTab';
import { DeportivoTab } from './edit-tabs/DeportivoTab';
import { HistoryTab } from './edit-tabs/HistoryTab';

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
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      guardian_name: '',
      guardian_relationship: '',
      guardian_phone: '',
      guardian_email: '',
      weight: undefined,
      height: undefined,
      size: '',
      blood_type: '',
      allergies: '',
      surgeries: '',
      injuries: '',
      limitations: '',
      education_level: '',
      current_grade: '',
      school_name: '',
      school_address: '',
      school_phone: '',
      school_email: '',
      boot_size: undefined,
      wheel_diameter: undefined,
      frame_size: '',
      boot_brand: '',
      frame_brand: '',
      track_wheels_brand: '',
      helmet_brand: '',
      years_experience: undefined,
      start_date: '',
      league_date: '',
      federation_date: '',
      registration_type: 'escuela',
      registration_number: '',
      is_league: false,
      is_federated: false,
      previous_club: '',
      eps: '',
      accident_insurance: '',
      fractures: '',
      physical_limitations: '',
      lycra_size: '',
      specialty: '',
      personal_phone: '',
      city_of_birth: '',
      neighborhood: '',
      nationality: 'colombiana',
      country: 'Colombia',
    },
  });

  useEffect(() => {
    if (athleteDetails) {
      setPhotoUrl(athleteDetails.avatar_url || null);
      form.reset({
        first_name: athleteDetails.first_name ?? '',
        last_name: athleteDetails.last_name ?? '',
        email: athleteDetails.email ?? '',
        phone: athleteDetails.phone ?? '',
        date_of_birth: athleteDetails.date_of_birth ?? '',
        category: athleteDetails.category as EditAthleteFormData['category'],
        level: athleteDetails.level as EditAthleteFormData['level'],
        status: athleteDetails.status as EditAthleteFormData['status'],
        gender: (athleteDetails.gender as EditAthleteFormData['gender']) || 'masculino',
        id_type: (athleteDetails.id_type as EditAthleteFormData['id_type']) || 'Tarjeta de identidad',
        id_number: athleteDetails.id_number ?? '',
        athlete_number: athleteDetails.athlete_number ?? '',
        emergency_contact_name: athleteDetails.emergency_contact_name ?? '',
        emergency_contact_phone: athleteDetails.emergency_contact_phone ?? '',
        medical_notes: athleteDetails.medical_notes ?? '',
        achievements: athleteDetails.achievements ?? '',
        performance_score: athleteDetails.performance_score ?? 0,
        bio: athleteDetails.bio ?? '',
        parent_name: athleteDetails.family?.parent_name ?? '',
        parent_phone: athleteDetails.family?.parent_phone ?? '',
        parent_email: athleteDetails.family?.parent_email ?? '',
        guardian_name: athleteDetails.family?.guardian_name ?? '',
        guardian_relationship: athleteDetails.family?.guardian_relationship ?? '',
        guardian_phone: athleteDetails.family?.guardian_phone ?? '',
        guardian_email: athleteDetails.family?.guardian_email ?? '',
        weight: athleteDetails.body_info?.weight || undefined,
        height: athleteDetails.body_info?.height || undefined,
        size: athleteDetails.body_info?.size ?? '',
        blood_type: athleteDetails.body_info?.blood_type ?? '',
        allergies: athleteDetails.body_info?.allergies ?? '',
        surgeries: athleteDetails.body_info?.surgeries ?? '',
        injuries: athleteDetails.body_info?.injuries ?? '',
        limitations: athleteDetails.body_info?.limitations ?? '',
        education_level: athleteDetails.studies?.education_level ?? '',
        current_grade: athleteDetails.studies?.current_grade ?? '',
        school_name: athleteDetails.studies?.school_name ?? '',
        school_address: athleteDetails.studies?.school_address ?? '',
        school_phone: athleteDetails.studies?.school_phone ?? '',
        school_email: athleteDetails.studies?.school_email ?? '',
        boot_size: athleteDetails.equipment?.boot_size || undefined,
        wheel_diameter: athleteDetails.equipment?.wheel_diameter || undefined,
        frame_size: athleteDetails.equipment?.frame_size ?? '',
        boot_brand: athleteDetails.equipment?.boot_brand ?? '',
        frame_brand: athleteDetails.equipment?.frame_brand ?? '',
        track_wheels_brand: athleteDetails.equipment?.track_wheels_brand ?? '',
        helmet_brand: athleteDetails.equipment?.helmet_brand ?? '',
        years_experience: athleteDetails.history?.years_experience || undefined,
        start_date: athleteDetails.history?.start_date ?? '',
        league_date: athleteDetails.history?.league_date ?? '',
        federation_date: athleteDetails.history?.federation_date ?? '',
        registration_type: (athleteDetails.registration_type as EditAthleteFormData['registration_type']) || 'escuela',
        registration_number: athleteDetails.registration_number ?? '',
        is_league: athleteDetails.history?.is_league ?? false,
        is_federated: athleteDetails.history?.is_federated ?? false,
        previous_club: athleteDetails.history?.previous_club ?? '',
        eps: (athleteDetails as Record<string, unknown>).eps as string ?? '',
        accident_insurance: (athleteDetails as Record<string, unknown>).accident_insurance as string ?? '',
        fractures: (athleteDetails as Record<string, unknown>).fractures as string ?? '',
        physical_limitations: (athleteDetails as Record<string, unknown>).physical_limitations as string ?? '',
        lycra_size: (athleteDetails as Record<string, unknown>).lycra_size as string ?? '',
        specialty: ((athleteDetails as Record<string, unknown>).specialty as EditAthleteFormData['specialty']) ?? '',
        personal_phone: (athleteDetails as Record<string, unknown>).personal_phone as string ?? '',
        city_of_birth: (athleteDetails as Record<string, unknown>).city_of_birth as string ?? '',
        neighborhood: (athleteDetails as Record<string, unknown>).neighborhood as string ?? '',
        nationality: (athleteDetails as Record<string, unknown>).nationality as string || 'colombiana',
        country: (athleteDetails as Record<string, unknown>).country as string || 'Colombia',
      });
    }
  }, [athleteDetails, form]);

  const onSubmit = async (data: EditAthleteFormData) => {
    if (!athlete) return;
    setIsLoading(true);

    try {
      if (athlete.user_id && photoUrl !== athleteDetails?.avatar_url) {
        const { error: avatarError } = await supabase
          .from('profiles')
          .update({ avatar_url: photoUrl || null })
          .eq('id', athlete.user_id);
        if (avatarError) {
          toast({ title: 'Advertencia', description: 'No se pudo actualizar la foto de perfil', variant: 'destructive' });
        }
      }

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
          registration_type: data.registration_type,
          registration_number: data.registration_number || null,
          eps: data.eps || null,
          accident_insurance: data.accident_insurance || null,
          fractures: data.fractures || null,
          physical_limitations: data.physical_limitations || null,
          lycra_size: data.lycra_size || null,
          specialty: data.specialty || null,
          personal_phone: data.personal_phone || null,
          city_of_birth: data.city_of_birth || null,
          neighborhood: data.neighborhood || null,
          nationality: data.nationality || 'colombiana',
          country: data.country || 'Colombia',
          updated_at: new Date().toISOString(),
        })
        .eq('id', athlete.id);

      if (athleteError) throw athleteError;

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

      // Family — check existence then upsert
      const { data: existingFamily } = await supabase
        .from('athlete_family')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const familyPayload = {
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
        const { error } = await supabase.from('athlete_family').update(familyPayload).eq('id', existingFamily.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('athlete_family').insert(familyPayload);
        if (error) throw error;
      }

      // Body info — unique on athlete_id
      const { error: bodyError } = await supabase.from('athlete_body_info').upsert({
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

      // Studies — check existence then upsert
      const { data: existingStudies } = await supabase
        .from('athlete_studies')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const studiesPayload = {
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
        const { error } = await supabase.from('athlete_studies').update(studiesPayload).eq('id', existingStudies.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('athlete_studies').insert(studiesPayload);
        if (error) throw error;
      }

      // Equipment — check existence then upsert
      const { data: existingEquipment } = await supabase
        .from('athlete_equipment')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const equipmentPayload = {
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
        const { error } = await supabase.from('athlete_equipment').update(equipmentPayload).eq('id', existingEquipment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('athlete_equipment').insert(equipmentPayload);
        if (error) throw error;
      }

      // History — check existence then upsert
      const { data: existingHistory } = await supabase
        .from('athlete_history')
        .select('id')
        .eq('athlete_id', athlete.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const historyPayload = {
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
        const { error } = await supabase.from('athlete_history').update(historyPayload).eq('id', existingHistory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('athlete_history').insert(historyPayload);
        if (error) throw error;
      }

      toast({ title: 'Atleta actualizado', description: 'Los datos del atleta se han actualizado correctamente.' });
      onAthleteUpdated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el atleta.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!athlete) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Atleta
            <Badge className={STATUS_COLORS[athlete.status] ?? 'bg-gray-100 text-gray-800'}>
              {STATUS_LABELS[athlete.status] ?? athlete.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Modifica la información del atleta {athlete.first_name} {athlete.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5 md:grid-cols-9 gap-1 h-auto p-1">
                <TabsTrigger value="basic" className="text-xs whitespace-nowrap">Básico</TabsTrigger>
                <TabsTrigger value="personal" className="text-xs whitespace-nowrap">Personal</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs whitespace-nowrap">Contacto</TabsTrigger>
                <TabsTrigger value="family" className="text-xs whitespace-nowrap">Familia</TabsTrigger>
                <TabsTrigger value="medical" className="text-xs whitespace-nowrap">Médico</TabsTrigger>
                <TabsTrigger value="studies" className="text-xs whitespace-nowrap">Estudios</TabsTrigger>
                <TabsTrigger value="equipment" className="text-xs whitespace-nowrap">Equipo</TabsTrigger>
                <TabsTrigger value="deportivo" className="text-xs whitespace-nowrap">Deportivo</TabsTrigger>
                <TabsTrigger value="history" className="text-xs whitespace-nowrap">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <BasicTab form={form} />
              </TabsContent>

              <TabsContent value="personal" className="space-y-4 pt-4">
                <PersonalTab
                  form={form}
                  photoUrl={photoUrl}
                  onPhotoChange={setPhotoUrl}
                  userId={athlete.user_id ?? undefined}
                  currentAvatarUrl={athleteDetails?.avatar_url ?? undefined}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 pt-4">
                <ContactTab form={form} />
              </TabsContent>

              <TabsContent value="family" className="space-y-4 pt-4">
                <FamilyTab form={form} />
              </TabsContent>

              <TabsContent value="medical" className="space-y-4 pt-4">
                <MedicalTab form={form} />
              </TabsContent>

              <TabsContent value="studies" className="space-y-4 pt-4">
                <StudiesTab form={form} />
              </TabsContent>

              <TabsContent value="equipment" className="space-y-4 pt-4">
                <EquipmentTab form={form} athleteId={athlete.id} />
              </TabsContent>

              <TabsContent value="deportivo" className="space-y-4 pt-4">
                <DeportivoTab form={form} />
              </TabsContent>

              <TabsContent value="history" className="space-y-4 pt-4">
                <HistoryTab form={form} />
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
