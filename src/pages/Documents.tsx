import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CreditCard, FileSpreadsheet } from 'lucide-react';
import { PermissionLetterGenerator } from '@/components/documents/PermissionLetterGenerator';
import { AthleteCardGenerator } from '@/components/documents/AthleteCardGenerator';
import { CompetitionExcelExport } from '@/components/documents/CompetitionExcelExport';

const Documents = () => (
  <DashboardLayout title="Documentos">
    <div className="space-y-6 max-w-none">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Genera cartas de permiso, carnets de deportistas y planillas de competencia
        </p>
      </div>

      <Tabs defaultValue="carta" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
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
      </Tabs>
    </div>
  </DashboardLayout>
);

export default Documents;
