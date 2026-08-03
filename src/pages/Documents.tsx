import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard, FileSpreadsheet, PenLine } from 'lucide-react';
import { PermissionLetterGenerator } from '@/components/documents/PermissionLetterGenerator';
import { AthleteCardGenerator } from '@/components/documents/AthleteCardGenerator';
import { CompetitionExcelExport } from '@/components/documents/CompetitionExcelExport';
import { DocumentSignatureDialog } from '@/components/documents/DocumentSignatureDialog';

const SIGNABLE_DOCS = [
  {
    id: 'autorizacion-entrenamiento',
    title: 'Autorización de Entrenamiento',
    description: 'Consentimiento para participar en sesiones de entrenamiento del club',
  },
  {
    id: 'autorizacion-competencia',
    title: 'Autorización de Competencia',
    description: 'Permiso para representar al club en competencias',
  },
  {
    id: 'consentimiento-medico',
    title: 'Consentimiento Médico',
    description: 'Autorización para atención médica de urgencia durante entrenamientos',
  },
  {
    id: 'reglamento-club',
    title: 'Reglamento del Club',
    description: 'Aceptación y compromiso de cumplir el reglamento interno',
  },
  {
    id: 'politica-datos',
    title: 'Política de Tratamiento de Datos',
    description: 'Consentimiento para el manejo de datos personales (HABEAS DATA)',
  },
];

const Documents = () => {
  const [signingDoc, setSigningDoc] = useState<{ id: string; title: string } | null>(null);

  return (
    <DashboardLayout title="Documentos">
      <div className="space-y-6 max-w-none">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Genera cartas de permiso, carnets, planillas de competencia y firma documentos digitalmente
          </p>
        </div>

        <Tabs defaultValue="carta" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="carta" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Carta Permiso
            </TabsTrigger>
            <TabsTrigger value="carnet" className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Carnet
            </TabsTrigger>
            <TabsTrigger value="planilla" className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Planilla Excel
            </TabsTrigger>
            <TabsTrigger value="firma" className="flex items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Firma Digital
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carta">
            <PermissionLetterGenerator />
          </TabsContent>

          <TabsContent value="carnet">
            <AthleteCardGenerator />
          </TabsContent>

          <TabsContent value="planilla">
            <CompetitionExcelExport />
          </TabsContent>

          <TabsContent value="firma">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Firma Digital de Documentos</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Firma los documentos del club de forma digital. Tu firma queda registrada con fecha y hora.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SIGNABLE_DOCS.map(doc => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <PenLine className="h-4 w-4 text-violet-500 flex-shrink-0" />
                            <h3 className="font-semibold text-sm">{doc.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{doc.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0 border-violet-200 text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950"
                          onClick={() => setSigningDoc({ id: doc.id, title: doc.title })}
                        >
                          <PenLine className="h-3.5 w-3.5 mr-1.5" />
                          Firmar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {signingDoc && (
        <DocumentSignatureDialog
          open={!!signingDoc}
          onClose={() => setSigningDoc(null)}
          documentTitle={signingDoc.title}
          documentId={signingDoc.id}
        />
      )}
    </DashboardLayout>
  );
};

export default Documents;
