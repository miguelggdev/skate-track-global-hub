import { useReportTemplate } from '@/hooks/useReportTemplate';
import { generateHTMLTemplate } from '@/utils/reportTemplateGenerator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FinancialReport } from '@/hooks/useFinancialReports';
import { formatCurrency, type CurrencyCode } from '@/utils/currency';

export interface AttendanceReportData {
  athlete_id: string;
  athlete_name: string;
  category: string;
  level: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_rate: number;
  last_attendance?: string | null;
}

export interface AttendanceReport {
  data: AttendanceReportData[];
  summary: {
    totalAthletes: number;
    totalSessions: number;
    averageAttendance: number;
    highAttendanceCount: number;
  };
  period: 'daily' | 'weekly' | 'monthly' | 'annual';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  category: string;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const generateFinancialReportPDF = async (report: FinancialReport, currency: CurrencyCode = 'COP'): Promise<void> => {
  const formatCurrencyValue = (value: number) => formatCurrency(value, currency);
  
  try {
    // Create a temporary container for the report
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Generate HTML content for the report
    const formatDate = (date: Date) => date.toLocaleDateString('es-ES');
    
    const getReportTitle = (type: string) => {
      switch (type) {
        case 'income': return 'Informe de Ingresos';
        case 'expenses': return 'Informe de Gastos';
        case 'balance': return 'Balance General';
        case 'complete': return 'Informe Completo';
        default: return 'Informe Financiero';
      }
    };

    tempContainer.innerHTML = `
      <div style="margin-bottom: 30px; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <h1 style="font-size: 24px; margin: 0; color: #1f2937;">${getReportTitle(report.type)}</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
          Período: ${formatDate(report.dateRange.startDate)} - ${formatDate(report.dateRange.endDate)}
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #059669; font-size: 14px;">INGRESOS TOTALES</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #059669;">${formatCurrencyValue(report.summary.totalIncome)}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 14px;">GASTOS TOTALES</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #dc2626;">${formatCurrencyValue(report.summary.totalExpenses)}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #2563eb; font-size: 14px;">BALANCE NETO</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${report.summary.netBalance >= 0 ? '#059669' : '#dc2626'}">${formatCurrencyValue(report.summary.netBalance)}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #d97706; font-size: 14px;">PENDIENTES</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #d97706;">${formatCurrencyValue(report.summary.pendingAmount)}</p>
        </div>
      </div>

      ${Object.keys(report.categoryBreakdown.income).length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Distribución de Ingresos</h2>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
            ${Object.entries(report.categoryBreakdown.income).map(([category, amount]) => {
              const percentage = (amount / report.summary.totalIncome) * 100;
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-weight: 500;">${escapeHtml(category)}</span>
                  <div>
                    <span style="font-weight: bold;">${formatCurrencyValue(amount)}</span>
                    <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">(${percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${Object.keys(report.categoryBreakdown.expenses).length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Distribución de Gastos</h2>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
            ${Object.entries(report.categoryBreakdown.expenses).map(([category, amount]) => {
              const percentage = (amount / report.summary.totalExpenses) * 100;
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-weight: 500;">${escapeHtml(category)}</span>
                  <div>
                    <span style="font-weight: bold;">${formatCurrencyValue(amount)}</span>
                    <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">(${percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Detalle de Transacciones (${report.transactions.length})</h2>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f9fafb; padding: 12px; font-weight: bold; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; border-bottom: 1px solid #e5e7eb;">
            <span>Descripción</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Cantidad</span>
          </div>
          ${report.transactions.slice(0, 20).map(transaction => {
            const isIncome = ['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type);
            const statusLabel = transaction.payment_status === 'paid' ? 'Pagado' : 
                              transaction.payment_status === 'pending' ? 'Pendiente' : 'Vencido';
            return `
              <div style="padding: 12px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; border-bottom: 1px solid #f3f4f6; align-items: center;">
                <div>
                  <div style="font-weight: 500;">${escapeHtml(transaction.description)}</div>
                  ${transaction.payer_name ? `<div style="font-size: 12px; color: #6b7280;">${escapeHtml(transaction.payer_name)}</div>` : ''}
                </div>
                <span style="font-size: 14px;">${formatDate(new Date(transaction.transaction_date))}</span>
                <span style="font-size: 12px; padding: 4px 8px; border-radius: 4px; background-color: ${
                  transaction.payment_status === 'paid' ? '#dcfce7' : 
                  transaction.payment_status === 'pending' ? '#fef3c7' : '#fee2e2'
                }; color: ${
                  transaction.payment_status === 'paid' ? '#166534' : 
                  transaction.payment_status === 'pending' ? '#92400e' : '#991b1b'
                };">${statusLabel}</span>
                <span style="font-weight: bold; color: ${isIncome ? '#059669' : '#dc2626'};">
                  ${isIncome ? '+' : '-'}${formatCurrencyValue(Math.abs(transaction.amount))}
                </span>
              </div>
            `;
          }).join('')}
          ${report.transactions.length > 20 ? `
            <div style="padding: 12px; text-align: center; color: #6b7280; font-style: italic;">
              ... y ${report.transactions.length - 20} transacciones más
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Informe generado el ${formatDate(new Date())}</p>
      </div>
    `;

    document.body.appendChild(tempContainer);

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const reportTypeLabel = getReportTitle(report.type).replace(/\s+/g, '_');
    const dateLabel = formatDate(report.dateRange.startDate).replace(/\//g, '-');
    const filename = `${reportTypeLabel}_${dateLabel}.pdf`;

    // Save the PDF
    pdf.save(filename);
    
  } catch (error) {
    throw new Error('Error al generar el PDF del informe');
  }
};

export const generateAttendanceReportPDF = async (report: AttendanceReport): Promise<void> => {
  try {
    // Create a temporary container for the report
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Helper functions
    const formatDate = (date: Date) => date.toLocaleDateString('es-ES');
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;
    
    const getPeriodLabel = () => {
      switch (report.period) {
        case 'daily': return 'Diario';
        case 'weekly': return 'Semanal';
        case 'monthly': return 'Mensual';
        case 'annual': return 'Anual';
        default: return 'Personalizado';
      }
    };

    const getAttendanceColor = (rate: number) => {
      if (rate >= 90) return '#059669';
      if (rate >= 75) return '#d97706';
      if (rate >= 60) return '#dc6803';
      return '#dc2626';
    };

    const getAttendanceBgColor = (rate: number) => {
      if (rate >= 90) return '#dcfce7';
      if (rate >= 75) return '#fef3c7';
      if (rate >= 60) return '#fed7aa';
      return '#fee2e2';
    };
    
    tempContainer.innerHTML = `
      <div style="margin-bottom: 30px; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <h1 style="font-size: 24px; margin: 0; color: #1f2937;">Informe de Asistencia ${getPeriodLabel()}</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
          Período: ${formatDate(report.dateRange.startDate)} - ${formatDate(report.dateRange.endDate)}
        </p>
        ${report.category !== 'all' ? `
          <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">
            Categoría: ${escapeHtml(report.category)}
          </p>
        ` : ''}
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #2563eb; font-size: 14px;">TOTAL ATLETAS</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #2563eb;">${report.summary.totalAthletes}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #059669; font-size: 14px;">SESIONES TOTALES</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #059669;">${report.summary.totalSessions}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #7c3aed; font-size: 14px;">ASISTENCIA PROMEDIO</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #7c3aed;">${formatPercent(report.summary.averageAttendance)}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 14px;">ALTA ASISTENCIA (+80%)</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #dc2626;">${report.summary.highAttendanceCount}</p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Detalle de Asistencia por Atleta (${report.data.length})</h2>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f9fafb; padding: 12px; font-weight: bold; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
            <span>ATLETA</span>
            <span>CATEGORÍA</span>
            <span>NIVEL</span>
            <span>SESIONES</span>
            <span>ASISTENCIA</span>
            <span>ÚLTIMA ASIST.</span>
          </div>
          ${report.data.slice(0, 25).map(athlete => `
            <div style="padding: 10px 12px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 10px; border-bottom: 1px solid #f3f4f6; align-items: center; font-size: 11px;">
              <div style="font-weight: 500; color: #1f2937;">${escapeHtml(athlete.athlete_name)}</div>
              <span style="color: #6b7280;">${escapeHtml(athlete.category)}</span>
              <span style="color: #6b7280;">${escapeHtml(athlete.level)}</span>
              <span style="color: #374151;">${athlete.attended_sessions}/${athlete.total_sessions}</span>
              <span style="font-weight: bold; padding: 3px 6px; border-radius: 4px; text-align: center; background-color: ${getAttendanceBgColor(athlete.attendance_rate)}; color: ${getAttendanceColor(athlete.attendance_rate)};">
                ${formatPercent(athlete.attendance_rate)}
              </span>
              <span style="color: #6b7280; font-size: 10px;">${athlete.last_attendance ? formatDate(new Date(athlete.last_attendance)) : 'N/A'}</span>
            </div>
          `).join('')}
          ${report.data.length > 25 ? `
            <div style="padding: 12px; text-align: center; color: #6b7280; font-style: italic; font-size: 12px;">
              ... y ${report.data.length - 25} atletas más
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="font-size: 14px; margin: 0; color: #1f2937;">Códigos de Color de Asistencia</h3>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; font-size: 11px;">
            <div style="width: 16px; height: 16px; background-color: #dcfce7; border-radius: 3px; margin-right: 8px;"></div>
            <span>≥90% Excelente</span>
          </div>
          <div style="display: flex; align-items: center; font-size: 11px;">
            <div style="width: 16px; height: 16px; background-color: #fef3c7; border-radius: 3px; margin-right: 8px;"></div>
            <span>75-89% Buena</span>
          </div>
          <div style="display: flex; align-items: center; font-size: 11px;">
            <div style="width: 16px; height: 16px; background-color: #fed7aa; border-radius: 3px; margin-right: 8px;"></div>
            <span>60-74% Regular</span>
          </div>
          <div style="display: flex; align-items: center; font-size: 11px;">
            <div style="width: 16px; height: 16px; background-color: #fee2e2; border-radius: 3px; margin-right: 8px;"></div>
            <span>&lt;60% Baja</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Informe de asistencia generado el ${formatDate(new Date())}</p>
      </div>
    `;

    document.body.appendChild(tempContainer);

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const periodLabel = getPeriodLabel();
    const categoryLabel = report.category !== 'all' ? `_${report.category.replace(/\s+/g, '_')}` : '';
    const dateLabel = formatDate(report.dateRange.startDate).replace(/\//g, '-');
    const filename = `Informe_Asistencia_${periodLabel}${categoryLabel}_${dateLabel}.pdf`;

    // Save the PDF
    pdf.save(filename);
    
  } catch (error) {
    throw new Error('Error al generar el PDF del informe de asistencia');
  }
};