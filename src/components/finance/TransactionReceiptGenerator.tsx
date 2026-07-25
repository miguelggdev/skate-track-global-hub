import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { useReportTemplate } from '@/hooks/useReportTemplate';
import { useCurrency } from '@/hooks/useCurrency';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  description: string;
  payer_name?: string;
  payer_identification?: string;
  payer_phone?: string;
  payer_email?: string;
  athletes?: {
    first_name: string;
    last_name: string;
    athlete_number?: string;
  };
}

interface TransactionReceiptGeneratorProps {
  transaction: Transaction;
  onReceiptGenerated?: (receiptUrl: string) => void;
}

export const TransactionReceiptGenerator: React.FC<TransactionReceiptGeneratorProps> = ({
  transaction,
  onReceiptGenerated,
}) => {
  const [generating, setGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { createReportTemplate, loading: templateLoading } = useReportTemplate();
  const { currency } = useCurrency();

  const generateReceiptNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REC-${year}${month}${day}-${random}`;
  };

  const generateReceiptPDF = async (isPreview = false) => {
    setGenerating(true);
    
    try {
      const pdf = new jsPDF();
      
      // Create report template with club configuration
      const template = await createReportTemplate(pdf);
      
      // Generate professional header
      let yPosition = template.generateHeader();
      yPosition += 10;

      // Receipt title
      yPosition = template.addTitle('RECIBO DE PAGO', 18);
      yPosition += 10;

      // Receipt details
      const receiptNumber = generateReceiptNumber();
      yPosition = template.addText(`Número de Recibo: ${receiptNumber}`, 12);
      yPosition = template.addText(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 10);
      yPosition = template.addSpace(10);

      // Payer information
      yPosition = template.addText('DATOS DEL PAGADOR:', 12);
      yPosition = template.addText(`Nombre: ${transaction.payer_name || 'No especificado'}`, 10);
      if (transaction.payer_identification) {
        yPosition = template.addText(`DNI/NIE: ${transaction.payer_identification}`, 10);
      }
      if (transaction.payer_phone) {
        yPosition = template.addText(`Teléfono: ${transaction.payer_phone}`, 10);
      }
      if (transaction.payer_email) {
        yPosition = template.addText(`Email: ${transaction.payer_email}`, 10);
      }
      yPosition = template.addSpace(10);

      // Athlete information
      if (transaction.athletes) {
        yPosition = template.addText('DATOS DEL ATLETA:', 12);
        yPosition = template.addText(`Nombre: ${transaction.athletes.first_name} ${transaction.athletes.last_name}`, 10);
        if (transaction.athletes.athlete_number) {
          yPosition = template.addText(`Número de Atleta: ${transaction.athletes.athlete_number}`, 10);
        }
        yPosition = template.addSpace(10);
      }

      // Transaction details
      yPosition = template.addText('DETALLE DEL PAGO:', 12);
      yPosition = template.addText(`Concepto: ${transaction.description}`, 10);
      yPosition = template.addText(`Tipo: ${transaction.transaction_type}`, 10);
      yPosition = template.addText(`Fecha de Transacción: ${new Date(transaction.transaction_date).toLocaleDateString('es-ES')}`, 10);
      yPosition = template.addSpace(10);

      // Amount with dynamic currency
      const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
      yPosition = template.addText(`IMPORTE: ${currencySymbol}${transaction.amount.toFixed(2)}`, 14);
      yPosition = template.addSpace(15);

      // Generate footer with club information and legal text
      template.generateFooter();
      
      // Add receipt specific footer text
      const footerY = pdf.internal.pageSize.height - 40;
      pdf.setFontSize(8);
      pdf.text('Este recibo certifica el pago realizado.', pdf.internal.pageSize.width / 2, footerY - 10, { align: 'center' });
      pdf.text('Conserve este documento para sus registros.', pdf.internal.pageSize.width / 2, footerY, { align: 'center' });

      if (isPreview) {
        // Open PDF in new window for preview
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      } else {
        // Save PDF and upload to storage
        const pdfBlob = pdf.output('blob');
        const fileName = `receipt_${receiptNumber}_${transaction.id}.pdf`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(`receipts/${fileName}`, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Still download the file locally
          pdf.save(fileName);
          toast.success('Recibo generado y descargado localmente');
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(`receipts/${fileName}`);
          
          // Update transaction with receipt URL
          if (onReceiptGenerated && urlData.publicUrl) {
            onReceiptGenerated(urlData.publicUrl);
          }
          
          // Download the file
          pdf.save(fileName);
          toast.success('Recibo generado, guardado y descargado exitosamente');
        }
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Error al generar el recibo');
    } finally {
      setGenerating(false);
      setPreviewMode(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Preview Button */}
      <Dialog open={previewMode} onOpenChange={setPreviewMode}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Vista Previa
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vista Previa del Recibo</DialogTitle>
            <DialogDescription>
              Revise los datos antes de generar el recibo final
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <h4 className="font-semibold">Datos del Pagador</h4>
              <p>Nombre: {transaction.payer_name || 'No especificado'}</p>
              {transaction.payer_identification && <p>DNI/NIE: {transaction.payer_identification}</p>}
              {transaction.payer_phone && <p>Teléfono: {transaction.payer_phone}</p>}
              {transaction.payer_email && <p>Email: {transaction.payer_email}</p>}
            </div>
            
            {transaction.athletes && (
              <div>
                <h4 className="font-semibold">Datos del Atleta</h4>
                <p>Nombre: {transaction.athletes.first_name} {transaction.athletes.last_name}</p>
                {transaction.athletes.athlete_number && <p>Número: {transaction.athletes.athlete_number}</p>}
              </div>
            )}
            
            <div>
              <h4 className="font-semibold">Detalle del Pago</h4>
              <p>Concepto: {transaction.description}</p>
              <p>Tipo: {transaction.transaction_type}</p>
              <p>Importe: {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency}{transaction.amount.toFixed(2)}</p>
              <p>Fecha: {new Date(transaction.transaction_date).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => generateReceiptPDF(true)}
              disabled={generating}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver PDF
            </Button>
            <Button
              onClick={() => generateReceiptPDF(false)}
              disabled={generating}
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? 'Generando...' : 'Descargar Recibo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Download Button */}
      <Button
        variant="default"
        size="sm"
        onClick={() => generateReceiptPDF(false)}
        disabled={generating}
        className="flex items-center gap-1"
      >
        {generating ? (
          <Download className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {generating ? 'Generando...' : 'Descargar Recibo'}
      </Button>
    </div>
  );
};