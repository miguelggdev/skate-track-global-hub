import { createWorkbook, addAoaSheet, downloadWorkbook } from './excel';
import { jsPDF } from "jspdf";
import { formatCurrency } from "./currency";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FinancialExportData {
  kpis: {
    currentMonthRevenue: number;
    pendingPaymentsAmount: number;
    athletesUpToDatePercentage: number;
    athletesInArrearsPercentage: number;
    averageMonthlyIncome: number;
    paymentsThisMonthCount: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  paymentStatus: { paid: number; pending: number; overdue: number };
  delinquentAthletes: Array<{
    name: string;
    monthsOverdue: number;
    totalPending: number;
  }>;
  paymentSummary: Array<{
    category: string;
    paidCount: number;
    pendingCount: number;
    totalCollected: number;
    totalPending: number;
  }>;
}

export async function exportToExcel(data: FinancialExportData, clubName: string) {
  const workbook = createWorkbook();

  // Sheet 1: KPI Summary
  const kpiData = [
    ["KPI", "Valor"],
    ["Ingresos del Mes", formatCurrency(data.kpis.currentMonthRevenue)],
    ["Pagos Pendientes", formatCurrency(data.kpis.pendingPaymentsAmount)],
    ["Atletas al Día (%)", `${data.kpis.athletesUpToDatePercentage.toFixed(1)}%`],
    ["Atletas en Mora (%)", `${data.kpis.athletesInArrearsPercentage.toFixed(1)}%`],
    ["Ingreso Promedio Mensual", formatCurrency(data.kpis.averageMonthlyIncome)],
    ["Pagos Este Mes", data.kpis.paymentsThisMonthCount.toString()],
  ];
  addAoaSheet(workbook, "Resumen KPIs", kpiData);

  // Sheet 2: Monthly Revenue
  const revenueData = [
    ["Mes", "Ingresos"],
    ...data.monthlyRevenue.map(row => [row.month, row.revenue]),
  ];
  addAoaSheet(workbook, "Ingresos Mensuales", revenueData);

  // Sheet 3: Payment Status
  const statusData = [
    ["Estado", "Cantidad"],
    ["Pagados", data.paymentStatus.paid],
    ["Pendientes", data.paymentStatus.pending],
    ["En Mora", data.paymentStatus.overdue],
  ];
  addAoaSheet(workbook, "Estado de Pagos", statusData);

  // Sheet 4: Delinquent Athletes
  if (data.delinquentAthletes.length > 0) {
    const delinquentData = [
      ["Atleta", "Meses en Mora", "Total Pendiente"],
      ...data.delinquentAthletes.map(row => [
        row.name,
        row.monthsOverdue,
        formatCurrency(row.totalPending),
      ]),
    ];
    addAoaSheet(workbook, "Atletas en Mora", delinquentData);
  }

  // Sheet 5: Payment Summary by Category
  const summaryData = [
    ["Categoría", "Pagados", "Pendientes", "Total Cobrado", "Total Pendiente"],
    ...data.paymentSummary.map(row => [
      row.category,
      row.paidCount,
      row.pendingCount,
      formatCurrency(row.totalCollected),
      formatCurrency(row.totalPending),
    ]),
  ];
  addAoaSheet(workbook, "Resumen por Categoría", summaryData);

  // Export
  const fileName = `Reporte_Financiero_${clubName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  await downloadWorkbook(workbook, fileName);
}

export async function exportToPDF(data: FinancialExportData, clubName: string, clubLogo?: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`Reporte Financiero`, pageWidth / 2, yPos, { align: "center" });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(clubName, pageWidth / 2, yPos, { align: "center" });
  
  yPos += 6;
  doc.setFontSize(10);
  doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }), pageWidth / 2, yPos, { align: "center" });

  // KPIs Section
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Indicadores Clave (KPIs)", 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const kpis = [
    ["Ingresos del Mes:", formatCurrency(data.kpis.currentMonthRevenue)],
    ["Pagos Pendientes:", formatCurrency(data.kpis.pendingPaymentsAmount)],
    ["Atletas al Día:", `${data.kpis.athletesUpToDatePercentage.toFixed(1)}%`],
    ["Atletas en Mora:", `${data.kpis.athletesInArrearsPercentage.toFixed(1)}%`],
    ["Ingreso Promedio Mensual:", formatCurrency(data.kpis.averageMonthlyIncome)],
    ["Pagos Este Mes:", data.kpis.paymentsThisMonthCount.toString()],
  ];

  kpis.forEach(([label, value]) => {
    doc.text(label, 20, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(value, 120, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 7;
  });

  // Payment Status
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Estado de Pagos", 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Pagados: ${data.paymentStatus.paid} atletas`, 20, yPos);
  yPos += 7;
  doc.text(`Pendientes: ${data.paymentStatus.pending} atletas`, 20, yPos);
  yPos += 7;
  doc.text(`En Mora: ${data.paymentStatus.overdue} atletas`, 20, yPos);

  // Payment Summary Table (new page)
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen por Categoría", 20, yPos);

  yPos += 10;
  doc.setFontSize(9);
  
  // Table headers
  doc.setFont("helvetica", "bold");
  doc.text("Categoría", 20, yPos);
  doc.text("Pagados", 70, yPos);
  doc.text("Pendientes", 100, yPos);
  doc.text("Total Cobrado", 135, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "normal");

  // Table rows
  data.paymentSummary.forEach((row) => {
    doc.text(row.category, 20, yPos);
    doc.text(row.paidCount.toString(), 70, yPos);
    doc.text(row.pendingCount.toString(), 100, yPos);
    doc.text(formatCurrency(row.totalCollected), 135, yPos);
    yPos += 7;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `Reporte_Financiero_${clubName}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
