import {
  Document, Page, Text, View, StyleSheet, Image, Font,
} from '@react-pdf/renderer';
import type { Profile, Client } from '@/types';
import { INDIAN_STATES } from '@/types';
import type { DeliveryChallan, ChallanItem } from '@/hooks/useDeliveryChallans';

Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79TR_V.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KE79TR_V.ttf', fontWeight: 700 },
  ],
});

const TEAL = '#03556E';
const TEAL_DARK = '#024558';
const TEAL_LIGHT = '#E8F4F8';
const TEAL_LIGHTER = '#F3FAFB';
const WHITE = '#ffffff';
const GRAY = '#6b7280';
const GRAY_DARK = '#374151';
const GRAY_LIGHT = '#9ca3af';
const BORDER = '#e5e7eb';

const s = StyleSheet.create({
  page: { padding: 0, fontSize: 9.5, fontFamily: 'Plus Jakarta Sans', color: GRAY_DARK },
  header: { backgroundColor: TEAL, paddingHorizontal: 40, paddingTop: 28, paddingBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 2 },
  headerRight: { textAlign: 'right', alignItems: 'flex-end' },
  companyName: { fontSize: 17, fontWeight: 'bold', color: WHITE, marginBottom: 3 },
  headerDetail: { fontSize: 8.5, color: 'rgba(255,255,255,0.78)', marginBottom: 1.5 },
  title: { fontSize: 22, fontWeight: 'bold', color: WHITE, letterSpacing: 1.5 },
  docNumber: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  ribbon: { backgroundColor: TEAL_DARK, flexDirection: 'row', paddingHorizontal: 40, paddingVertical: 8, gap: 30, justifyContent: 'flex-end' },
  ribbonItem: { flexDirection: 'row', gap: 4 },
  ribbonLabel: { fontSize: 8, color: 'rgba(255,255,255,0.55)' },
  ribbonValue: { fontSize: 8, fontWeight: 'bold', color: WHITE },
  body: { paddingHorizontal: 40, paddingTop: 18 },
  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, gap: 20 },
  partyBox: { flex: 1, padding: 12, backgroundColor: TEAL_LIGHTER, borderRadius: 6, border: `0.5px solid ${BORDER}` },
  partyTitle: { fontSize: 7.5, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  partyName: { fontSize: 10.5, fontWeight: 'bold', marginBottom: 2 },
  partyDetail: { fontSize: 8.5, color: GRAY, marginBottom: 1.5, lineHeight: 1.4 },
  table: { marginBottom: 14 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: TEAL, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 4 },
  tableHeaderCell: { fontSize: 8, fontWeight: 'bold', color: WHITE, textTransform: 'uppercase', letterSpacing: 0.6 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 6, borderBottom: `0.5px solid ${BORDER}` },
  tableRowAlt: { backgroundColor: TEAL_LIGHTER },
  tableCell: { fontSize: 9 },
  tableCellBold: { fontSize: 9, fontWeight: 'bold' },
  colNum: { width: 30 },
  colDesc: { flex: 3 },
  colQty: { width: 60, textAlign: 'right' },
  transportBox: { padding: 12, backgroundColor: TEAL_LIGHTER, borderRadius: 6, border: `0.5px solid ${BORDER}`, marginBottom: 18 },
  transportTitle: { fontSize: 7.5, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  transportRow: { flexDirection: 'row', gap: 30, marginBottom: 4 },
  transportLabel: { fontSize: 8, color: GRAY_LIGHT },
  transportValue: { fontSize: 9, fontWeight: 'bold' },
  notesSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 7.5, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 9, color: GRAY, lineHeight: 1.5 },
  legalFooter: { position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', paddingVertical: 6 },
  legalText: { fontSize: 7, color: GRAY_LIGHT },
  pageNumber: { fontSize: 7, color: GRAY_LIGHT, marginTop: 2 },
});

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return dateStr; }
}

interface Props {
  challan: DeliveryChallan;
  items: ChallanItem[];
  client: Client | null;
  profile: Profile;
}

export function ChallanPdfDocument({ challan, items, client, profile }: Props) {
  return (
    <Document title={`Challan ${challan.challan_number}`} author={profile.org_name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            {profile.logo_url && <Image src={profile.logo_url} style={{ width: 46, height: 46, marginBottom: 5, objectFit: 'contain' }} />}
            <Text style={s.companyName}>{profile.org_name}</Text>
            {profile.address && <Text style={s.headerDetail}>{profile.address}</Text>}
            {profile.gstin && <Text style={s.headerDetail}>GSTIN: {profile.gstin}</Text>}
            {profile.phone && <Text style={s.headerDetail}>Phone: {profile.phone}</Text>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.title}>DELIVERY CHALLAN</Text>
            <Text style={s.docNumber}>{challan.challan_number}</Text>
          </View>
        </View>

        <View style={s.ribbon}>
          <View style={s.ribbonItem}>
            <Text style={s.ribbonLabel}>Date:</Text>
            <Text style={s.ribbonValue}>{formatDate(challan.date_issued)}</Text>
          </View>
          <View style={s.ribbonItem}>
            <Text style={s.ribbonLabel}>Status:</Text>
            <Text style={s.ribbonValue}>{challan.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.parties}>
            <View style={s.partyBox}>
              <Text style={s.partyTitle}>Deliver To</Text>
              {client ? (
                <>
                  <Text style={s.partyName}>{client.name}</Text>
                  {client.billing_address && <Text style={s.partyDetail}>{client.billing_address}</Text>}
                  {client.gstin && <Text style={s.partyDetail}>GSTIN: {client.gstin}</Text>}
                  <Text style={s.partyDetail}>State: {INDIAN_STATES[client.state_code]} ({client.state_code})</Text>
                </>
              ) : (
                <Text style={[s.partyDetail, { fontStyle: 'italic' }]}>Walk-in Customer</Text>
              )}
            </View>
            <View style={s.partyBox}>
              <Text style={s.partyTitle}>From</Text>
              <Text style={s.partyName}>{profile.org_name}</Text>
              {profile.address && <Text style={s.partyDetail}>{profile.address}</Text>}
              {profile.gstin && <Text style={s.partyDetail}>GSTIN: {profile.gstin}</Text>}
            </View>
          </View>

          {(challan.transport_mode || challan.vehicle_number || challan.dispatch_from || challan.dispatch_to) && (
            <View style={s.transportBox}>
              <Text style={s.transportTitle}>Transport Details</Text>
              <View style={s.transportRow}>
                {challan.transport_mode && <View><Text style={s.transportLabel}>Mode</Text><Text style={s.transportValue}>{challan.transport_mode}</Text></View>}
                {challan.vehicle_number && <View><Text style={s.transportLabel}>Vehicle No.</Text><Text style={s.transportValue}>{challan.vehicle_number}</Text></View>}
              </View>
              <View style={s.transportRow}>
                {challan.dispatch_from && <View><Text style={s.transportLabel}>From</Text><Text style={s.transportValue}>{challan.dispatch_from}</Text></View>}
                {challan.dispatch_to && <View><Text style={s.transportLabel}>To</Text><Text style={s.transportValue}>{challan.dispatch_to}</Text></View>}
              </View>
            </View>
          )}

          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={[s.tableHeaderCell, s.colNum]}>#</Text>
              <Text style={[s.tableHeaderCell, s.colDesc]}>Description</Text>
              <Text style={[s.tableHeaderCell, s.colQty]}>Qty</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                <Text style={[s.tableCell, s.colNum]}>{i + 1}</Text>
                <Text style={[s.tableCellBold, s.colDesc]}>{item.description}</Text>
                <Text style={[s.tableCell, s.colQty]}>{item.qty}</Text>
              </View>
            ))}
          </View>

          {challan.notes && (
            <View style={s.notesSection}>
              <Text style={s.sectionLabel}>Notes</Text>
              <Text style={s.notesText}>{challan.notes}</Text>
            </View>
          )}
        </View>

        <View style={s.legalFooter}>
          <Text style={s.legalText}>This is a computer-generated delivery challan and does not require a physical signature.</Text>
          <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
