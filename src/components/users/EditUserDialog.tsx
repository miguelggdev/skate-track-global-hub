import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserDetails } from '@/hooks/useUserDetails';
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
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/pages/UserManagement';
import { ProfileTab } from './tabs/ProfileTab';
import { ContactTab } from './tabs/ContactTab';
import { MedicalTab } from './tabs/MedicalTab';
import { ProfessionalTab } from './tabs/ProfessionalTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { AdministrativeTab } from './tabs/AdministrativeTab';
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

interface EditUserFormData {
  // Profile
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  role: 'admin' | 'coach' | 'athlete' | 'delegate' | 'leader' | 'finance';
  bio?: string;
  id_type?: string;
  id_number?: string;
  gender?: string;
  
  // Contact
  nationality?: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  landline_phone?: string;
  languages?: string[];
  
  // Medical
  blood_type?: string;
  rh_factor?: string;
  diseases?: string;
  allergies?: string;
  disability?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  health_insurance?: string;
  sports_insurance_policy?: string;
  insurance_expiry_date?: string;
  
  // Coach Professional (conditional)
  academic_level?: string;
  degree_title?: string;
  education_institution?: string;
  training_certifications?: string;
  years_experience?: number;
  experience_description?: string;
  coach_category?: string;
  license_number?: string;
  federation_license_expiry?: string;
  certification_level?: string;
  hourly_rate?: number;
  specialization?: string;
  
  // Administrative
  status?: string;
  observations?: string;
  data_consent?: boolean;
  accepts_regulations?: boolean;
  created_at?: string;
  updated_at?: string;
}

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isLeader } = useUserProfile();
  
  // Fetch detailed user data
  const { data: userDetails, refetch: refetchUserDetails } = useUserDetails(user?.id || null);
  
  // Check if current user can edit roles
  const canEditRoles = isAdmin || isLeader;
  
  const form = useForm<EditUserFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      role: 'athlete',
      bio: '',
      id_type: '',
      id_number: '',
      gender: '',
      nationality: '',
      address: '',
      city: '',
      department: '',
      country: '',
      landline_phone: '',
      languages: [],
      blood_type: '',
      rh_factor: '',
      diseases: '',
      allergies: '',
      disability: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      emergency_contact_phone: '',
      health_insurance: '',
      sports_insurance_policy: '',
      insurance_expiry_date: '',
      academic_level: '',
      degree_title: '',
      education_institution: '',
      training_certifications: '',
      years_experience: 0,
      experience_description: '',
      coach_category: '',
      license_number: '',
      federation_license_expiry: '',
      certification_level: '',
      hourly_rate: 0,
      specialization: '',
      status: 'active',
      observations: '',
      data_consent: false,
      accepts_regulations: false,
    },
  });

  useEffect(() => {
    if (userDetails) {
      form.reset({
        first_name: userDetails.first_name,
        last_name: userDetails.last_name,
        email: userDetails.email,
        phone: userDetails.phone || '',
        date_of_birth: userDetails.date_of_birth || '',
        role: userDetails.role as any,
        bio: userDetails.bio || '',
        id_type: userDetails.id_type || '',
        id_number: userDetails.id_number || '',
        gender: userDetails.gender || '',
        nationality: userDetails.nationality || '',
        address: userDetails.address || '',
        city: userDetails.city || '',
        department: userDetails.department || '',
        country: userDetails.country || '',
        landline_phone: userDetails.landline_phone || '',
        languages: userDetails.languages || [],
        // Medical info
        blood_type: userDetails.medical_info?.blood_type || '',
        rh_factor: userDetails.medical_info?.rh_factor || '',
        diseases: userDetails.medical_info?.diseases || '',
        allergies: userDetails.medical_info?.allergies || '',
        disability: userDetails.medical_info?.disability || '',
        emergency_contact_name: userDetails.medical_info?.emergency_contact_name || '',
        emergency_contact_relationship: userDetails.medical_info?.emergency_contact_relationship || '',
        emergency_contact_phone: userDetails.medical_info?.emergency_contact_phone || '',
        health_insurance: userDetails.medical_info?.health_insurance || '',
        sports_insurance_policy: userDetails.medical_info?.sports_insurance_policy || '',
        insurance_expiry_date: userDetails.medical_info?.insurance_expiry_date || '',
        // Coach details
        academic_level: userDetails.coach_details?.academic_level || '',
        degree_title: userDetails.coach_details?.degree_title || '',
        education_institution: userDetails.coach_details?.education_institution || '',
        training_certifications: userDetails.coach_details?.training_certifications || '',
        years_experience: userDetails.coach_details?.years_experience || 0,
        experience_description: userDetails.coach_details?.experience_description || '',
        coach_category: userDetails.coach_details?.coach_category || '',
        license_number: userDetails.coach_details?.license_number || '',
        federation_license_expiry: userDetails.coach_details?.federation_license_expiry || '',
        certification_level: userDetails.coach_details?.certification_level || '',
        hourly_rate: userDetails.coach_details?.hourly_rate || 0,
        specialization: userDetails.coach_details?.specialization || '',
        // Administrative
        status: userDetails.status || 'active',
        observations: userDetails.observations || '',
        data_consent: userDetails.data_consent || false,
        accepts_regulations: userDetails.accepts_regulations || false,
        created_at: userDetails.created_at,
        updated_at: userDetails.updated_at,
      });
      setPhotoUrl(userDetails.avatar_url || null);
    }
  }, [userDetails, form]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    try {
      setLoading(true);

      // Update profiles table
      const profileData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.date_of_birth || null,
        bio: data.bio,
        avatar_url: photoUrl,
        id_type: data.id_type,
        id_number: data.id_number,
        gender: data.gender,
        nationality: data.nationality,
        address: data.address,
        city: data.city,
        department: data.department,
        country: data.country,
        landline_phone: data.landline_phone,
        languages: data.languages,
        status: data.status,
        observations: data.observations,
        data_consent: data.data_consent,
        accepts_regulations: data.accepts_regulations,
        updated_at: new Date().toISOString(),
      };

      if (canEditRoles) {
        profileData.role = data.role;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update medical info
      const { error: medicalError } = await supabase
        .from('user_medical_info')
        .upsert({
          user_id: user.id,
          blood_type: data.blood_type,
          rh_factor: data.rh_factor,
          diseases: data.diseases,
          allergies: data.allergies,
          disability: data.disability,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_relationship: data.emergency_contact_relationship,
          emergency_contact_phone: data.emergency_contact_phone,
          health_insurance: data.health_insurance,
          sports_insurance_policy: data.sports_insurance_policy,
          insurance_expiry_date: data.insurance_expiry_date || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (medicalError) throw medicalError;

      // Update coach details if role is coach
      if (data.role === 'coach' || user.role === 'coach') {
        const { data: existingCoach } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const coachData = {
          user_id: user.id,
          academic_level: data.academic_level,
          degree_title: data.degree_title,
          education_institution: data.education_institution,
          training_certifications: data.training_certifications,
          years_experience: data.years_experience,
          experience_description: data.experience_description,
          coach_category: data.coach_category,
          license_number: data.license_number,
          federation_license_expiry: data.federation_license_expiry || null,
          certification_level: data.certification_level,
          hourly_rate: data.hourly_rate,
          specialization: data.specialization,
          updated_at: new Date().toISOString(),
        };

        if (existingCoach) {
          const { error: coachError } = await supabase
            .from('coaches')
            .update(coachData)
            .eq('id', existingCoach.id);
          if (coachError) throw coachError;
        } else {
          const { error: coachError } = await supabase
            .from('coaches')
            .insert(coachData);
          if (coachError) throw coachError;
        }
      }

      toast({
        title: "Éxito",
        description: "Usuario actualizado exitosamente",
      });

      refetchUserDetails();
      onOpenChange(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isCoach = form.watch('role') === 'coach' || user.role === 'coach';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información del usuario seleccionado.
          </DialogDescription>
        </DialogHeader>

        {!userDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
              <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="contact">Contacto</TabsTrigger>
                  <TabsTrigger value="medical">Médico</TabsTrigger>
                  {isCoach && <TabsTrigger value="professional">Profesional</TabsTrigger>}
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  {isAdmin && <TabsTrigger value="administrative">Admin</TabsTrigger>}
                </TabsList>

                <div className="flex-1 overflow-y-auto min-h-0">
                  <TabsContent value="profile">
                    <ProfileTab
                      form={form}
                      photoUrl={photoUrl}
                      onPhotoChange={setPhotoUrl}
                      userId={user.id}
                      canEditRoles={canEditRoles}
                      currentRole={user.role}
                    />
                  </TabsContent>

                  <TabsContent value="contact">
                    <ContactTab form={form} />
                  </TabsContent>

                  <TabsContent value="medical">
                    <MedicalTab form={form} />
                  </TabsContent>

                  {isCoach && (
                    <TabsContent value="professional">
                      <ProfessionalTab form={form} />
                    </TabsContent>
                  )}

                  <TabsContent value="documents">
                    <DocumentsTab
                      form={form}
                      userId={user.id}
                      documents={userDetails?.documents}
                      onDocumentsUpdate={refetchUserDetails}
                    />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="administrative">
                      <AdministrativeTab form={form} isAdmin={isAdmin} />
                    </TabsContent>
                  )}
                </div>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;