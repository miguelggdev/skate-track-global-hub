import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { UserDocument } from '@/hooks/useUserDetails';

interface DocumentsTabProps {
  form: UseFormReturn<any>;
  userId?: string;
  documents?: UserDocument[];
  onDocumentsUpdate: () => void;
}

export const DocumentsTab = ({ userId, documents = [], onDocumentsUpdate }: DocumentsTabProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('cv');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${selectedType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName);

      // Save document record to database
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          document_type: selectedType,
          document_name: file.name,
          document_url: urlData.publicUrl,
          uploaded_by: userId,
        });

      if (dbError) throw dbError;

      toast({
        title: "Documento subido",
        description: "El documento se ha guardado exitosamente",
      });

      onDocumentsUpdate();
      event.target.value = ''; // Reset input
    } catch (error: any) {
      toast({
        title: "Error al subir documento",
        description: error.message || "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: UserDocument) => {
    if (!userId) return;

    try {
      // Parse file path from URL
      const urlParts = doc.document_url.split('/storage/v1/object/public/user-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('user-documents')
          .remove([filePath]);
      }

      // Delete database record
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado exitosamente",
      });

      onDocumentsUpdate();
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el documento",
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cv: 'Currículum Vitae',
      contract: 'Contrato',
      certificate: 'Certificado',
      reference: 'Referencias',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
        <Label>Subir Nuevo Documento</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cv">Currículum Vitae</SelectItem>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="certificate">Certificado</SelectItem>
                <SelectItem value="reference">Referencias</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Archivo</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading || !userId}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
          </div>
        </div>

        {uploading && (
          <p className="text-sm text-muted-foreground">Subiendo documento...</p>
        )}

        <p className="text-xs text-muted-foreground">
          Formatos aceptados: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
        </p>
      </div>

      <div className="space-y-2">
        <Label>Documentos Guardados</Label>
        
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay documentos guardados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocumentTypeLabel(doc.document_type)} • 
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.document_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
