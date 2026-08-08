import React from 'react';
import {
  Document, Page, View, Text, StyleSheet,
} from '@react-pdf/renderer';

const ORANGE = '#f97316';
const DARK   = '#0d1526';
const GRAY   = '#64748b';
const LIGHT  = '#f1f5f9';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#ffffff', padding: 0 },

  header: { backgroundColor: DARK, padding: '28 32 24 32' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontFamily: 'Helvetica-Bold' },
  headerInfo: { flex: 1 },
  name: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 3 },
  subtitle: { fontSize: 10, color: ORANGE, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  badge: { backgroundColor: 'rgba(249,115,22,0.18)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { color: ORANGE, fontSize: 9, fontFamily: 'Helvetica-Bold' },

  accentBar: { backgroundColor: ORANGE, height: 4 },

  body: { padding: '24 32 32 32', gap: 20 },

  row2: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },

  section: { marginBottom: 4 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: ORANGE, letterSpacing: 0.8, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4, marginBottom: 10 },

  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  kpiBox: { flex: 1, backgroundColor: LIGHT, borderRadius: 8, padding: 10, alignItems: 'center' },
  kpiVal: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK },
  kpiLbl: { fontSize: 8, color: GRAY, marginTop: 2, textAlign: 'center' },

  text: { fontSize: 10, color: DARK, lineHeight: 1.5 },
  label: { fontSize: 9, color: GRAY, marginBottom: 2 },
  value: { fontSize: 10, color: DARK, fontFamily: 'Helvetica-Bold', marginBottom: 8 },

  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 6 },
  tableHeader: { backgroundColor: LIGHT, paddingVertical: 6, paddingHorizontal: 0, flexDirection: 'row', borderRadius: 4 },
  tableCell: { flex: 1, fontSize: 9, color: DARK, paddingHorizontal: 4 },
  tableHeaderCell: { flex: 1, fontSize: 8, color: GRAY, fontFamily: 'Helvetica-Bold', paddingHorizontal: 4, textTransform: 'uppercase' },

  medalDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4, marginTop: 1 },

  footer: { backgroundColor: DARK, padding: '12 32', flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: GRAY },
  footerBrand: { fontSize: 8, color: ORANGE, fontFamily: 'Helvetica-Bold' },
});

// ─── Document ───────────────────────────────────────────────────────────────

export interface CVData {
  athlete: {
    first_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    category?: string;
    level?: string;
    club_name?: string | null;
    main_discipline?: string | null;
    bio?: string | null;
    short_term_goals?: string | null;
    long_term_goals?: string | null;
  };
  profile?: {
    city?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  kpis?: {
    totalSessions?: number;
    totalHours?: number;
    competitionCount?: number;
    medals?: { gold?: number; silver?: number; bronze?: number };
  };
  competitions?: Array<{
    competitions?: { name?: string; start_date?: string; location?: string };
    position?: number | null;
    medal_type?: string | null;
  }>;
}

function initials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function age(dob?: string | null) {
  if (!dob) return '—';
  const d = new Date(dob);
  return String(new Date().getFullYear() - d.getFullYear());
}

export function AthleteCVDocument({ data }: { data: CVData }) {
  const { athlete, profile, kpis, competitions = [] } = data;
  const fullName = `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim();
  const medals = kpis?.medals ?? { gold: 0, silver: 0, bronze: 0 };

  return (
    <Document title={`CV Deportivo — ${fullName}`} author="SpeedSkateTrack">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(athlete.first_name, athlete.last_name)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.subtitle}>{athlete.main_discipline ?? 'Patinaje de Velocidad'}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{athlete.category ?? '—'} · {athlete.level ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.accentBar} />

        {/* Body */}
        <View style={styles.body}>
          {/* KPI Row */}
          <View style={styles.kpiRow}>
            {[
              { v: kpis?.totalSessions ?? 0, l: 'Sesiones' },
              { v: kpis?.totalHours ?? 0, l: 'Horas' },
              { v: kpis?.competitionCount ?? 0, l: 'Competencias' },
              { v: (medals.gold ?? 0) + (medals.silver ?? 0) + (medals.bronze ?? 0), l: 'Medallas' },
            ].map((k, i) => (
              <View key={i} style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{k.v}</Text>
                <Text style={styles.kpiLbl}>{k.l}</Text>
              </View>
            ))}
          </View>

          {/* Two columns */}
          <View style={styles.row2}>
            {/* Left: Personal + Contact */}
            <View style={styles.col}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información Personal</Text>
                <Text style={styles.label}>Edad</Text>
                <Text style={styles.value}>{age(athlete.date_of_birth)} años</Text>
                <Text style={styles.label}>Club</Text>
                <Text style={styles.value}>{athlete.club_name ?? '—'}</Text>
                <Text style={styles.label}>Ciudad / País</Text>
                <Text style={styles.value}>{[profile?.city, profile?.country].filter(Boolean).join(', ') || '—'}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contacto</Text>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{profile?.email ?? '—'}</Text>
                <Text style={styles.label}>Teléfono</Text>
                <Text style={styles.value}>{profile?.phone ?? '—'}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medallero</Text>
                {[
                  { emoji: '🥇', label: 'Oro', count: medals.gold ?? 0, color: '#f59e0b' },
                  { emoji: '🥈', label: 'Plata', count: medals.silver ?? 0, color: '#94a3b8' },
                  { emoji: '🥉', label: 'Bronce', count: medals.bronze ?? 0, color: '#cd7c2f' },
                ].map((m) => (
                  <View key={m.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <View style={[styles.medalDot, { backgroundColor: m.color }]} />
                    <Text style={{ fontSize: 10, color: DARK, flex: 1 }}>{m.label}</Text>
                    <Text style={{ fontSize: 12, color: m.color, fontFamily: 'Helvetica-Bold' }}>{m.count}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right: Bio + Goals */}
            <View style={styles.col}>
              {athlete.bio && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Perfil Deportivo</Text>
                  <Text style={styles.text}>{athlete.bio}</Text>
                </View>
              )}
              {athlete.short_term_goals && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Objetivos a Corto Plazo</Text>
                  <Text style={styles.text}>{athlete.short_term_goals}</Text>
                </View>
              )}
              {athlete.long_term_goals && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Objetivos a Largo Plazo</Text>
                  <Text style={styles.text}>{athlete.long_term_goals}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Competition history */}
          {competitions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historial de Competencias</Text>
              <View style={styles.tableHeader}>
                {['Competencia', 'Fecha', 'Lugar', 'Posición', 'Medalla'].map(h => (
                  <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
                ))}
              </View>
              {competitions.slice(0, 8).map((c, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{c.competitions?.name ?? '—'}</Text>
                  <Text style={styles.tableCell}>{c.competitions?.start_date ? new Date(c.competitions.start_date).toLocaleDateString('es') : '—'}</Text>
                  <Text style={styles.tableCell}>{c.competitions?.location ?? '—'}</Text>
                  <Text style={styles.tableCell}>{c.position ?? '—'}</Text>
                  <Text style={styles.tableCell}>{c.medal_type ? c.medal_type.charAt(0).toUpperCase() + c.medal_type.slice(1) : '—'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generado por SpeedSkateTrack · {new Date().toLocaleDateString('es')}</Text>
          <Text style={styles.footerBrand}>speedskatetrack.com</Text>
        </View>
      </Page>
    </Document>
  );
}
