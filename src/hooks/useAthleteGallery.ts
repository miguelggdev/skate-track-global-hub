import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GalleryImage {
  id: string;
  athlete_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

const MAX_IMAGES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg'];

export const useAthleteGallery = (athleteId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch gallery images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['athlete-gallery', athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      
      const { data, error } = await supabase
        .from('athlete_gallery')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!athleteId,
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Solo se permiten archivos JPEG');
      }

      // Check max images
      if (images.length >= MAX_IMAGES) {
        throw new Error(`Máximo ${MAX_IMAGES} imágenes permitidas`);
      }

      // Get next display order
      const nextOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order)) + 1 
        : 1;

      if (nextOrder > MAX_IMAGES) {
        throw new Error(`Máximo ${MAX_IMAGES} imágenes permitidas`);
      }

      // Upload to storage
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('athlete-gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('athlete-gallery')
        .getPublicUrl(fileName);

      // Insert into database
      const { error: dbError } = await supabase
        .from('athlete_gallery')
        .insert({
          athlete_id: athleteId,
          image_url: urlData.publicUrl,
          display_order: nextOrder,
        });

      if (dbError) throw dbError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-gallery', athleteId] });
      toast({ title: 'Imagen subida correctamente' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al subir imagen', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const imageToDelete = images.find(img => img.id === imageId);
      if (!imageToDelete) throw new Error('Imagen no encontrada');

      // Extract file path from URL
      const urlParts = imageToDelete.image_url.split('/athlete-gallery/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('athlete-gallery').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('athlete_gallery')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-gallery', athleteId] });
      toast({ title: 'Imagen eliminada' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al eliminar imagen', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Replace image mutation
  const replaceMutation = useMutation({
    mutationFn: async ({ imageId, file, userId }: { imageId: string; file: File; userId: string }) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Solo se permiten archivos JPEG');
      }

      const imageToReplace = images.find(img => img.id === imageId);
      if (!imageToReplace) throw new Error('Imagen no encontrada');

      // Delete old file from storage
      const urlParts = imageToReplace.image_url.split('/athlete-gallery/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('athlete-gallery').remove([filePath]);
      }

      // Upload new file
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('athlete-gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('athlete-gallery')
        .getPublicUrl(fileName);

      // Update database
      const { error: dbError } = await supabase
        .from('athlete_gallery')
        .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', imageId);

      if (dbError) throw dbError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-gallery', athleteId] });
      toast({ title: 'Imagen reemplazada correctamente' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al reemplazar imagen', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    images,
    isLoading,
    canAddMore: images.length < MAX_IMAGES,
    maxImages: MAX_IMAGES,
    uploadImage: uploadMutation.mutate,
    deleteImage: deleteMutation.mutate,
    replaceImage: replaceMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReplacing: replaceMutation.isPending,
  };
};
