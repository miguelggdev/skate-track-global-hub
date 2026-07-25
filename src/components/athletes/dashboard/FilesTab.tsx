import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Download } from 'lucide-react';

export const FilesTab = () => {
  const documents = [
    'Copia de Documento',
    'Carnet EPS',
    'Carnet de Liga',
    'Carnet Federación',
    'Póliza de Accidentes',
    'Autorización de Datos'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Mis Archivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <h4 className="font-medium">{doc}</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};