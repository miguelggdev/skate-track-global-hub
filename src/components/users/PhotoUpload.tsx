import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (url: string | null) => void;
  userId?: string;
  className?: string;
}

export const PhotoUpload = ({ currentPhotoUrl, onPhotoChange, userId, className }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos JPG/JPEG",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo debe ser menor a 2MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // If userId is provided, upload to Supabase
      if (userId) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/profile.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, file, { 
            upsert: true,
            contentType: file.type 
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);

        onPhotoChange(data.publicUrl);
        
        toast({
          title: "Foto subida exitosamente",
          description: "La foto de perfil se ha actualizado",
        });
      } else {
        // For new users, just store the file object for later upload
        onPhotoChange(objectUrl);
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error al subir la foto",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      if (userId && currentPhotoUrl) {
        // Delete from Supabase storage
        const fileName = `${userId}/profile.jpg`; // Assuming jpg extension
        await supabase.storage
          .from('profiles')
          .remove([fileName]);
      }

      setPreviewUrl(null);
      onPhotoChange(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Foto eliminada",
        description: "La foto de perfil se ha eliminado",
      });
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast({
        title: "Error al eliminar la foto",
        description: error.message || "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Foto de Perfil</Label>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Photo preview */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Upload controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo..." : "Subir Foto"}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Help text */}
        <p className="text-xs text-muted-foreground text-center">
          Solo archivos JPG/JPEG. Máximo 2MB.
        </p>
      </div>
    </div>
  );
};