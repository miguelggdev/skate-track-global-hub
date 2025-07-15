import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image } from 'lucide-react';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoUpdate: (logoUrl: string) => void;
}

const LogoUpload = ({ currentLogoUrl, onLogoUpdate }: LogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadLogo = async (file: File) => {
    try {
      setUploading(true);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `club-logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('club-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('club-logos')
        .getPublicUrl(data.path);

      // Update club settings
      const { error: updateError } = await supabase
        .from('club_settings')
        .update({ club_logo_url: publicUrl })
        .eq('id', (await supabase.from('club_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      onLogoUpdate(publicUrl);
      
      toast({
        title: "Éxito",
        description: "Logo del club actualizado correctamente",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogo(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadLogo(file);
    }
  };

  const removeLogo = async () => {
    try {
      const { error } = await supabase
        .from('club_settings')
        .update({ club_logo_url: null })
        .eq('id', (await supabase.from('club_settings').select('id').single()).data?.id);

      if (error) throw error;

      onLogoUpdate('');
      
      toast({
        title: "Éxito",
        description: "Logo del club eliminado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el logo",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logo del Club
        </CardTitle>
        <CardDescription>
          Sube el logo de tu club que aparecerá en toda la aplicación. Formatos soportados: JPG, PNG, SVG (máx. 2MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Logo Preview */}
        {currentLogoUrl && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <img
                src={currentLogoUrl}
                alt="Logo actual del club"
                className="h-12 w-auto object-contain rounded"
              />
              <span className="text-sm text-muted-foreground">Logo actual</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeLogo}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {dragActive ? 'Suelta el archivo aquí' : 'Arrastra tu logo aquí'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            o haz clic para seleccionar un archivo
          </p>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-upload"
            disabled={uploading}
          />
          
          <Button
            variant="outline"
            asChild
            disabled={uploading}
            className="cursor-pointer"
          >
            <label htmlFor="logo-upload">
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
            </label>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Tamaño recomendado: 180x60 píxeles para escritorio, 120x40 para móvil</p>
          <p>• Formatos: JPG, PNG, SVG</p>
          <p>• Tamaño máximo: 2MB</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUpload;