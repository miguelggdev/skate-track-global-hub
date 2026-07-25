import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FinancialReportGenerator } from './FinancialReportGenerator';
import { FinancialReport } from '@/hooks/useFinancialReports';

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: FinancialReport | null;
}

export const ReportPreviewDialog: React.FC<ReportPreviewDialogProps> = ({
  open,
  onOpenChange,
  report
}) => {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Vista Previa del Informe</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[80vh] pr-4">
          <FinancialReportGenerator report={report} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};