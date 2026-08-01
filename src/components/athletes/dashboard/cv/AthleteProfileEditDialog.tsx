import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Trophy, Share2, Target, Images } from 'lucide-react';
import { AthleteSocials } from '@/hooks/useAthleteSocials';
import AthleteGallery from './AthleteGallery';

interface AthleteProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: any;
  profile: any;
  socials: AthleteSocials | null;
  onSave: () => void;
}

const AthleteProfileEditDialog: React.FC<AthleteProfileEditDialogProps> = ({
  open,
  onOpenChange,
  athlete,
  profile,
  socials,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Personal
    first_name: '',
    last_name: '',
    city: '',
    country: '',
    // Sports
    club_name: '',
    main_discipline: '',
    bio: '',
    personal_values: '',
    short_term_goals: '',
    long_term_goals: '',
    // Socials
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    youtube: '',
    twitter: ''
  });

  useEffect(() => {
    if (open && athlete) {
      setFormData({
        first_name: athlete.first_name ?? '',
        last_name: athlete.last_name ?? '',
        city: profile?.city ?? '',
        country: profile?.country ?? '',
        club_name: athlete.club_name ?? '',
        main_discipline: athlete.main_discipline ?? '',
        bio: athlete.bio ?? '',
        personal_values: athlete.personal_values ?? '',
        short_term_goals: athlete.short_term_goals ?? '',
        long_term_goals: athlete.long_term_goals ?? '',
        instagram: socials?.instagram ?? '',
        facebook: socials?.facebook ?? '',
        tiktok: socials?.tiktok ?? '',
        whatsapp: socials?.whatsapp ?? '',
        youtube: socials?.youtube ?? '',
        twitter: socials?.twitter ?? ''
      });
    }
  }, [open, athlete, profile, socials]);

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Update athlete table
      const { error: athleteError } = await supabase
        .from('athletes')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          club_name: formData.club_name || null,
          main_discipline: formData.main_discipline || null,
          bio: formData.bio || null,
          personal_values: formData.personal_values || null,
          short_term_goals: formData.short_term_goals || null,
          long_term_goals: formData.long_term_goals || null
        })
        .eq('id', athlete.id);

      if (athleteError) throw athleteError;

      // Update profile table if needed
      if (profile?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            city: formData.city || null,
            country: formData.country || null
          })
          .eq('id', profile.id);

        if (profileError) throw profileError;
      }

      // Update or insert socials
      const socialsData = {
        athlete_id: athlete.id,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        tiktok: formData.tiktok || null,
        whatsapp: formData.whatsapp || null,
        youtube: formData.youtube || null,
        twitter: formData.twitter || null
      };

      if (socials?.id) {
        const { error: socialsError } = await supabase
          .from('athlete_socials')
          .update(socialsData)
          .eq('id', socials.id);
        if (socialsError) throw socialsError;
      } else {
        const { error: socialsError } = await supabase
          .from('athlete_socials')
          .insert(socialsData);
        if (socialsError) throw socialsError;
      }

      toast({ title: 'Perfil actualizado correctamente' });
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil Deportivo</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="sports" className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Deportivo</span>
            </TabsTrigger>
            <TabsTrigger value="socials" className="flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Redes</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Metas</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1.5">
              <Images className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Galería</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sports" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Club / Academia</Label>
                <Input
                  value={formData.club_name}
                  onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Disciplina Principal</Label>
                <Select
                  value={formData.main_discipline}
                  onValueChange={(v) => setFormData({ ...formData, main_discipline: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inline_skating">Patinaje en Línea</SelectItem>
                    <SelectItem value="cycling">Ciclismo</SelectItem>
                    <SelectItem value="gym">Gimnasio</SelectItem>
                    <SelectItem value="running">Atletismo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Biografía</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Cuéntanos sobre tu trayectoria deportiva..."
              />
            </div>
          </TabsContent>

          <TabsContent value="socials" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="usuario"
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  placeholder="@canal"
                />
              </div>
              <div className="space-y-2">
                <Label>Twitter/X</Label>
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Valores Personales</Label>
              <Textarea
                value={formData.personal_values}
                onChange={(e) => setFormData({ ...formData, personal_values: e.target.value })}
                rows={3}
                placeholder="Disciplina, compromiso, trabajo en equipo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Metas a Corto Plazo (1 año)</Label>
              <Textarea
                value={formData.short_term_goals}
                onChange={(e) => setFormData({ ...formData, short_term_goals: e.target.value })}
                rows={3}
                placeholder="Mejorar tiempos, clasificar a competencia regional..."
              />
            </div>
            <div className="space-y-2">
              <Label>Metas a Largo Plazo (3-5 años)</Label>
              <Textarea
                value={formData.long_term_goals}
                onChange={(e) => setFormData({ ...formData, long_term_goals: e.target.value })}
                rows={3}
                placeholder="Representar al país en competencias internacionales..."
              />
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sube hasta 5 imágenes en formato JPEG para mostrar en tu perfil deportivo.
              </p>
              <AthleteGallery athleteId={athlete?.id} editable={true} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AthleteProfileEditDialog;
