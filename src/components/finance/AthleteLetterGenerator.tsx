import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useAthletes } from '@/hooks/useAthletes';
import { useCurrentMonthPayment, useClubSettings } from '@/hooks/useCurrentMonthPayment';
import { useReportTemplate } from '@/hooks/useReportTemplate';
import { useCurrency } from '@/hooks/useCurrency';

interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  athlete_number?: string;
  date_of_birth?: string;
}

export const AthleteLetterGenerator: React.FC = () => {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const { data: athletes = [], isLoading: athletesLoading } = useAthletes();
  const { data: paymentData, isLoading: paymentLoading } = useCurrentMonthPayment(selectedAthleteId);
  const { data: clubSettings } = useClubSettings();
  const { createReportTemplate } = useReportTemplate();
  const { currency } = useCurrency();

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  const generateLetterPDF = async (letterType: 'freedom' | 'peace') => {
    if (!selectedAthlete || !paymentData?.hasPaid) return;

    setGenerating(true);

    try {
      const pdf = new jsPDF();
      
      // Create report template with club configuration
      const template = await createReportTemplate(pdf);
      
      // Generate professional header
      let yPosition = template.generateHeader();
      yPosition += 20;

      // Date and location
      const today = new Date();
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      const day = today.getDate();
      const month = months[today.getMonth()];
      const year = today.getFullYear();

      pdf.setFontSize(12);
      pdf.text(`${day} de ${month} de ${year}`, pdf.internal.pageSize.width - 20, yPosition, { align: 'right' });
      yPosition += 20;

      // Add payment details if athlete is up to date
      if (paymentData?.hasPaid && paymentData.transactions.length > 0) {
        const lastPayment = paymentData.transactions[0];
        const paymentDate = new Date(lastPayment.transaction_date).toLocaleDateString('es-ES');
        const paymentAmount = lastPayment.amount;
        
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(
          `Último pago registrado: ${paymentDate} – Valor: ${currency}${paymentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
          20,
          yPosition
        );
        pdf.setTextColor(0, 0, 0);
        yPosition += 10;
      }

      // Subject
      const subject = letterType === 'freedom' ? 'CARTA DE LIBERTAD' : 'PAZ Y SALVO';
      yPosition = template.addTitle(`ASUNTO: ${subject}`, 12);
      yPosition = template.addSpace(15);

      // Letter content
      const athleteFullName = `${selectedAthlete.first_name} ${selectedAthlete.last_name}`;
      const athleteNumber = (selectedAthlete as { athlete_number?: string | null }).athlete_number ?? 'Sin número';

      if (letterType === 'freedom') {
        yPosition = template.addText(
          `Por medio de la presente, nuestro club concede la Carta de Libertad al/la deportista ${athleteFullName}, ` +
          `identificado/a con documento No. ${athleteNumber}, para que pueda trasladarse al club y/o liga de su preferencia.`,
          11
        );
      } else {
        yPosition = template.addText(
          `Por medio de la presente, nuestro club certifica que el/la deportista ${athleteFullName}, ` +
          `identificado/a con documento No. ${athleteNumber}, se encuentra a paz y salvo por todo concepto ` +
          `con este club hasta la fecha de su retiro.`,
          11
        );
      }

      yPosition = template.addSpace(25);

      // Closing
      yPosition = template.addText(`Dada a los ${day} días del mes de ${month} de ${year}.`, 11);
      yPosition = template.addSpace(40);

      yPosition = template.addText('Atentamente,', 11);
      yPosition = template.addSpace(30);
      yPosition = template.addText('_________________________', 11);
      
      // Generate footer with signature section
      template.generateFooter();

      // Download the PDF
      const fileName = `${letterType === 'freedom' ? 'carta_libertad' : 'paz_y_salvo'}_${athleteFullName.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success(
        letterType === 'freedom' 
          ? 'Carta de Libertad generada exitosamente' 
          : 'Carta de Paz y Salvo generada exitosamente'
      );
    } catch (error) {
      toast.error('Error al generar la carta');
    } finally {
      setGenerating(false);
    }
  };

  if (athletesLoading) {
    return <div className="p-4">Cargando atletas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generar Cartas de Atletas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Athlete Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Seleccionar Atleta</label>
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un atleta..." />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((athlete) => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  {athlete.first_name} {athlete.last_name}
                  {(athlete as AthleteData).athlete_number && ` - #${(athlete as AthleteData).athlete_number}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Validation */}
        {selectedAthleteId && (
          <div className="space-y-4">
            {paymentLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Verificando estado de pago...</span>
              </div>
            ) : paymentData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {paymentData.hasPaid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">
                        El deportista tiene pago activo para el mes actual
                        {paymentData.lastPaymentMonth && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({new Date(paymentData.lastPaymentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})
                          </span>
                        )}
                      </span>
                      <Badge variant="default" className="ml-2">
                        {paymentData.paymentStatus === 'paid' ? 'Al día' : paymentData.paymentStatus}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-destructive font-medium">
                        El deportista no tiene pago registrado para el mes actual
                      </span>
                      <Badge variant="destructive" className="ml-2">
                        {paymentData.paymentStatus === 'overdue' ? 'Atrasado' : 'Pendiente'}
                      </Badge>
                    </>
                  )}
                </div>

                {paymentData.hasPaid && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => generateLetterPDF('freedom')}
                      disabled={generating}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {generating ? 'Generando...' : 'Descargar Carta de Libertad (PDF)'}
                    </Button>

                    <Button
                      onClick={() => generateLetterPDF('peace')}
                      disabled={generating}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {generating ? 'Generando...' : 'Descargar Carta de Paz y Salvo (PDF)'}
                    </Button>
                  </div>
                )}

                {/* Payment Details */}
                {paymentData.hasPaid && paymentData.transactions.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Últimos pagos registrados:</h4>
                    <div className="space-y-2">
                      {paymentData.transactions.map((transaction: any) => (
                        <div key={transaction.id} className="flex justify-between items-center text-sm">
                          <span>{transaction.description}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency}{transaction.amount.toFixed(2)}</Badge>
                            <span className="text-green-600">
                              {new Date(transaction.transaction_date).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};