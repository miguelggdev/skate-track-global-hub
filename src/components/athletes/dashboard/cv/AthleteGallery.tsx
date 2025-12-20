import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images, Plus, X, RefreshCw, Loader2 } from 'lucide-react';
import { useAthleteGallery } from '@/hooks/useAthleteGallery';
import { useAuth } from '@/hooks/useAuth';

interface AthleteGalleryProps {
  athleteId: string | null;
  editable?: boolean;
}

const AthleteGallery: React.FC<AthleteGalleryProps> = ({ athleteId, editable = false }) => {
  const { user } = useAuth();
  const {
    images,
    isLoading,
    canAddMore,
    maxImages,
    uploadImage,
    deleteImage,
    replaceImage,
    isUploading,
    isDeleting,
    isReplacing,
  } = useAthleteGallery(athleteId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = React.useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      uploadImage({ file, userId: user.id });
    }
    e.target.value = '';
  };

  const handleReplaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id && replaceTargetId) {
      replaceImage({ imageId: replaceTargetId, file, userId: user.id });
      setReplaceTargetId(null);
    }
    e.target.value = '';
  };

  const triggerReplace = (imageId: string) => {
    setReplaceTargetId(imageId);
    replaceInputRef.current?.click();
  };

  const isProcessing = isUploading || isDeleting || isReplacing;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-purple-500/10">
              <Images className="h-4 w-4 text-purple-500" />
            </div>
            Galería de Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-purple-500/10">
              <Images className="h-4 w-4 text-purple-500" />
            </div>
            Galería de Imágenes
            <span className="text-sm font-normal text-muted-foreground">
              ({images.length}/{maxImages})
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="relative aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/30 group"
            >
              <img
                src={image.image_url}
                alt={`Galería ${image.display_order}`}
                className="w-full h-full object-cover"
              />
              {editable && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => triggerReplace(image.id)}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => deleteImage(image.id)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          {editable && canAddMore && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="aspect-square rounded-lg border-2 border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Plus className="h-6 w-6" />
                  <span className="text-xs">Agregar</span>
                </>
              )}
            </button>
          )}

          {/* Empty state placeholders */}
          {!editable && images.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              <Images className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay imágenes en la galería</p>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          className="hidden"
          onChange={handleReplaceSelect}
        />

        {editable && (
          <p className="text-xs text-muted-foreground mt-3">
            Solo archivos JPEG • Máximo {maxImages} imágenes
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AthleteGallery;
