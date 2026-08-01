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
        phone: userDetails.phone ?? '',
        date_of_birth: userDetails.date_of_birth ?? '',
        role: userDetails.role as EditUserFormData['role'],
        // Coach details (only columns that exist in our coaches table)
        license_number: userDetails.coach_details?.license_number ?? '',
        certification_level: userDetails.coach_details?.certification_level ?? '',
        years_experience: userDetails.coach_details?.years_experience ?? 0,
        specialization: userDetails.coach_details?.specialization ?? '',
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

      // Update only columns that exist in profiles schema
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          date_of_birth: data.date_of_birth || null,
          avatar_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Role is stored in user_roles, not in profiles
      if (canEditRoles) {
        await supabase.from('user_roles').delete().eq('user_id', user.id);
        await supabase.from('user_roles').insert([{ user_id: user.id, role: data.role }]);
      }

      // Update coach details if role is coach (only columns that exist in our coaches table)
      if (data.role === 'coach' || user.role === 'coach') {
        const { data: existingCoach } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const coachData = {
          user_id: user.id,
          license_number: data.license_number || null,
          certification_level: data.certification_level || null,
          specialization: data.specialization || null,
          years_experience: data.years_experience ?? 0,
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
                      documents={[]}
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