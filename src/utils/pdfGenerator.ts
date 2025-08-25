import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FinancialReport } from '@/hooks/useFinancialReports';

export const generateFinancialReportPDF = async (report: FinancialReport): Promise<void> => {
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
    const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
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
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #059669;">${formatCurrency(report.summary.totalIncome)}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 14px;">GASTOS TOTALES</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #dc2626;">${formatCurrency(report.summary.totalExpenses)}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #2563eb; font-size: 14px;">BALANCE NETO</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${report.summary.netBalance >= 0 ? '#059669' : '#dc2626'}">${formatCurrency(report.summary.netBalance)}</p>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #d97706; font-size: 14px;">PENDIENTES</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #d97706;">${formatCurrency(report.summary.pendingAmount)}</p>
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
                  <span style="font-weight: 500;">${category}</span>
                  <div>
                    <span style="font-weight: bold;">${formatCurrency(amount)}</span>
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
                  <span style="font-weight: 500;">${category}</span>
                  <div>
                    <span style="font-weight: bold;">${formatCurrency(amount)}</span>
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
                  <div style="font-weight: 500;">${transaction.description}</div>
                  ${transaction.payer_name ? `<div style="font-size: 12px; color: #6b7280;">${transaction.payer_name}</div>` : ''}
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
                  ${isIncome ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
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
    console.error('Error generating PDF:', error);
    throw new Error('Error al generar el PDF del informe');
  }
};