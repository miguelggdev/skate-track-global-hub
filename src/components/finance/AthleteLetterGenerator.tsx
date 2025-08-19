import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useAthletes } from '@/hooks/useAthletes';
import { useLastMonthPayment, useClubSettings } from '@/hooks/useLastMonthPayment';

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
  const { data: paymentData, isLoading: paymentLoading } = useLastMonthPayment(selectedAthleteId);
  const { data: clubSettings } = useClubSettings();

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  const generateLetterPDF = async (letterType: 'freedom' | 'peace') => {
    if (!selectedAthlete || !paymentData?.hasPaid) return;

    setGenerating(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text
      const addText = (text: string, fontSize = 10, isBold = false, align: 'left' | 'center' | 'right' = 'left') => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }
        
        let xPosition = margin;
        if (align === 'center') {
          xPosition = pageWidth / 2;
        } else if (align === 'right') {
          xPosition = pageWidth - margin;
        }
        
        pdf.text(text, xPosition, yPosition, { align });
        yPosition += fontSize * 0.4 + 5;
      };

      // Add space
      const addSpace = (space = 10) => {
        yPosition += space;
      };

      // Club header
      if (clubSettings?.club_logo_url) {
        // You could add logo loading logic here
        addText('[LOGO DEL CLUB]', 12, true, 'center');
      }
      
      const clubName = clubSettings?.club_name || 'Mi Club de Patinaje';
      addText(clubName.toUpperCase(), 16, true, 'center');
      addSpace(15);

      // Date and location
      const today = new Date();
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      const city = clubSettings?.address?.split(',')[0] || 'Madrid';
      const day = today.getDate();
      const month = months[today.getMonth()];
      const year = today.getFullYear();

      addText(`${city}, ${day} de ${month} de ${year}`, 12, false, 'right');
      addSpace(20);

      // Subject
      const subject = letterType === 'freedom' ? 'CARTA DE LIBERTAD' : 'PAZ Y SALVO';
      addText(`ASUNTO: ${subject}`, 12, true);
      addSpace(15);

      // Letter content
      const athleteFullName = `${selectedAthlete.first_name} ${selectedAthlete.last_name}`;
      const athleteNumber = (selectedAthlete as any).athlete_number || 'Sin número';

      if (letterType === 'freedom') {
        addText(
          `Por medio de la presente, ${clubName} concede la Carta de Libertad al/la deportista ${athleteFullName}, ` +
          `identificado/a con documento No. ${athleteNumber}, para que pueda trasladarse al club y/o liga de su preferencia.`,
          11,
          false
        );
      } else {
        addText(
          `Por medio de la presente, ${clubName} certifica que el/la deportista ${athleteFullName}, ` +
          `identificado/a con documento No. ${athleteNumber}, se encuentra a paz y salvo por todo concepto ` +
          `con este club hasta la fecha de su retiro.`,
          11,
          false
        );
      }

      addSpace(25);

      // Closing
      addText(`Dada en ${city}, a los ${day} días del mes de ${month} de ${year}.`, 11);
      addSpace(25);

      addText('Atentamente,', 11);
      addSpace(20);
      addText('_________________________', 11);
      
      const presidentName = clubSettings?.president_name || '[NOMBRE DEL PRESIDENTE]';
      addText(presidentName, 11, true);
      addText(clubName, 11, true);
      
      addSpace(15);

      // Footer
      const address = clubSettings?.address || '[DIRECCIÓN]';
      const phone = clubSettings?.contact_phone || '[TELÉFONO]';
      const email = clubSettings?.contact_email || '[CORREO]';
      const website = clubSettings?.website_url || '[WEB]';
      
      addText(`${address} | ${phone} | ${email} | ${website}`, 9, false, 'center');

      // Download the PDF
      const fileName = `${letterType === 'freedom' ? 'carta_libertad' : 'paz_y_salvo'}_${athleteFullName.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success(
        letterType === 'freedom' 
          ? 'Carta de Libertad generada exitosamente' 
          : 'Carta de Paz y Salvo generada exitosamente'
      );
    } catch (error) {
      console.error('Error generating letter:', error);
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
                  {(athlete as any).athlete_number && ` - #${(athlete as any).athlete_number}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Validation */}
        {selectedAthleteId && (
          <div className="space-y-4">
            {paymentLoading ? (
              <div className="text-center p-4">Validando pago del último mes...</div>
            ) : paymentData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {paymentData.hasPaid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">
                        El deportista tiene registrado el pago del último mes
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700 font-medium">
                        El deportista no tiene registrado el pago del último mes
                      </span>
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
                            <Badge variant="default">€{transaction.amount.toFixed(2)}</Badge>
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