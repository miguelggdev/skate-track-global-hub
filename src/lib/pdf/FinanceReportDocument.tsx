import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, PDFDownloadLink,
} from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';

const ORANGE = '#f97316';
const DARK   = '#0d1526';
const GRAY   = '#64748b';
const GREEN  = '#10b981';
const RED    = '#ef4444';
const LIGHT  = '#f8fafc';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#ffffff', padding: 0 },
  header: { backgroundColor: DARK, padding: '24 32 20 32' },
  headerTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  headerSub: { fontSize: 9, color: GRAY, marginTop: 4 },
  accentBar: { backgroundColor: ORANGE, height: 4 },
  body: { padding: '24 32 32 32' },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: ORANGE, letterSpacing: 0.8, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4, marginBottom: 10, marginTop: 18 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  kpiBox: { flex: 1, backgroundColor: LIGHT, borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: ORANGE },
  kpiVal: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK },
  kpiLbl: { fontSize: 8, color: GRAY, marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '6 4', borderRadius: 4, marginBottom: 2 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableCell: { flex: 1, fontSize: 9, color: DARK },
  tableHCell: { flex: 1, fontSize: 8, color: GRAY, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  positive: { color: GREEN, fontFamily: 'Helvetica-Bold' },
  negative: { color: RED, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DARK, padding: '10 32', flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: GRAY },
  footerBrand: { fontSize: 8, color: ORANGE, fontFamily: 'Helvetica-Bold' },
});

export interface FinanceTransaction {
  transaction_date?: string;
  description?: string;
  amount?: number;
  transaction_type?: string;
  payment_status?: string;
  payer_name?: string;
}

interface FinanceReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  pendingAmount: number;
  transactions: FinanceTransaction[];
  currency?: string;
}

function fmt(amount: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function FinanceReportDocument({ data }: { data: FinanceReportData }) {
  const { period, totalIncome, totalExpenses, pendingAmount, transactions, currency = 'COP' } = data;
  const balance = totalIncome - totalExpenses;

  return (
    <Document title={`Reporte Financiero — ${period}`} author="SpeedSkateTrack">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reporte Financiero</Text>
          <Text style={styles.headerSub}>Período: {period} · Generado: {new Date().toLocaleDateString('es')}</Text>
        </View>
        <View style={styles.accentBar} />

        <View style={styles.body}>
          {/* KPI Row */}
          <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
          <View style={styles.kpiRow}>
            {[
              { v: fmt(totalIncome, currency), l: 'Ingresos totales', positive: true },
              { v: fmt(totalExpenses, currency), l: 'Gastos totales', positive: false },
              { v: fmt(balance, currency), l: 'Balance neto', positive: balance >= 0 },
              { v: fmt(pendingAmount, currency), l: 'Pendiente cobro', positive: null },
            ].map((k, i) => (
              <View key={i} style={[styles.kpiBox, { borderLeftColor: k.positive === null ? GRAY : k.positive ? GREEN : RED }]}>
                <Text style={[styles.kpiVal, k.positive === null ? {} : k.positive ? styles.positive : styles.negative]}>{k.v}</Text>
                <Text style={styles.kpiLbl}>{k.l}</Text>
              </View>
            ))}
          </View>

          {/* Transaction Table */}
          <Text style={styles.sectionTitle}>Detalle de Transacciones</Text>
          <View style={styles.tableHeader}>
            {['Fecha', 'Descripción', 'Pagador/a', 'Tipo', 'Monto', 'Estado'].map(h => (
              <Text key={h} style={styles.tableHCell}>{h}</Text>
            ))}
          </View>
          {transactions.slice(0, 30).map((t, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? {} : { backgroundColor: '#fafafa' }]}>
              <Text style={styles.tableCell}>{t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('es') : '—'}</Text>
              <Text style={styles.tableCell}>{(t.description ?? '').slice(0, 20)}</Text>
              <Text style={styles.tableCell}>{(t.payer_name ?? '—').slice(0, 16)}</Text>
              <Text style={styles.tableCell}>{t.transaction_type ?? '—'}</Text>
              <Text style={[styles.tableCell, styles.positive]}>{fmt(t.amount ?? 0, currency)}</Text>
              <Text style={[styles.tableCell, t.payment_status === 'paid' ? styles.positive : styles.negative]}>
                {t.payment_status === 'paid' ? 'Pagado' : t.payment_status === 'pending' ? 'Pendiente' : t.payment_status ?? '—'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>SpeedSkateTrack · Reporte confidencial</Text>
          <Text style={styles.footerBrand}>speedskatetrack.com</Text>
        </View>
      </Page>
    </Document>
  );
}

interface FinanceReportButtonProps {
  data: FinanceReportData;
}

export function FinanceReportDownloadButton({ data }: FinanceReportButtonProps) {
  const filename = `reporte_financiero_${data.period.replace(/\s/g, '_')}.pdf`;

  return (
    <PDFDownloadLink document={<FinanceReportDocument data={data} />} fileName={filename}>
      {({ loading }) => (
        <Button variant="outline" size="sm" className="gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
          {loading ? 'Generando…' : 'Exportar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
