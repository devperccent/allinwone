import {
  Document, Page, Text, View, StyleSheet, Image, Font,
} from '@react-pdf/renderer';
import type { Profile } from '@/types';
import type { PurchaseOrder, POItem } from '@/hooks/usePurchaseOrders';

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

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return dateStr; }
}

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
  colNum: { width: 25 },
  colDesc: { flex: 2.5 },
  colQty: { width: 40, textAlign: 'right' },
  colRate: { width: 65, textAlign: 'right' },
  colTax: { width: 55, textAlign: 'right' },
  colAmount: { width: 70, textAlign: 'right' },
  totalsBox: { width: 220, backgroundColor: TEAL_LIGHT, borderRadius: 6, padding: 12, border: `0.5px solid ${BORDER}`, alignSelf: 'flex-end', marginBottom: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: GRAY },
  totalValue: { fontSize: 9, fontWeight: 'bold' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 6, borderTop: `2px solid ${TEAL}` },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: TEAL_DARK },
  grandTotalValue: { fontSize: 14, fontWeight: 'bold', color: TEAL },
  notesSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 7.5, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 9, color: GRAY, lineHeight: 1.5 },
  legalFooter: { position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', paddingVertical: 6 },
  legalText: { fontSize: 7, color: GRAY_LIGHT },
  pageNumber: { fontSize: 7, color: GRAY_LIGHT, marginTop: 2 },
});

interface Props {
  po: PurchaseOrder;
  items: POItem[];
  profile: Profile;
}

export function PurchaseOrderPdfDocument({ po, items, profile }: Props) {
  return (
    <Document title={`PO ${po.po_number}`} author={profile.org_name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            {profile.logo_url && <Image src={profile.logo_url} style={{ width: 46, height: 46, marginBottom: 5, objectFit: 'contain' }} />}
            <Text style={s.companyName}>{profile.org_name}</Text>
            {profile.address && <Text style={s.headerDetail}>{profile.address}</Text>}
            {profile.gstin && <Text style={s.headerDetail}>GSTIN: {profile.gstin}</Text>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.title}>PURCHASE ORDER</Text>
            <Text style={s.docNumber}>{po.po_number}</Text>
          </View>
        </View>

        <View style={s.ribbon}>
          <View style={s.ribbonItem}>
            <Text style={s.ribbonLabel}>Issued:</Text>
            <Text style={s.ribbonValue}>{formatDate(po.date_issued)}</Text>
          </View>
          {po.expected_delivery && (
            <View style={s.ribbonItem}>
              <Text style={s.ribbonLabel}>Expected:</Text>
              <Text style={s.ribbonValue}>{formatDate(po.expected_delivery)}</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          <View style={s.parties}>
            <View style={s.partyBox}>
              <Text style={s.partyTitle}>Supplier</Text>
              <Text style={s.partyName}>{po.supplier_name}</Text>
              {po.supplier_gstin && <Text style={s.partyDetail}>GSTIN: {po.supplier_gstin}</Text>}
              {po.supplier_address && <Text style={s.partyDetail}>{po.supplier_address}</Text>}
            </View>
            <View style={s.partyBox}>
              <Text style={s.partyTitle}>Ship To</Text>
              <Text style={s.partyName}>{profile.org_name}</Text>
              {profile.address && <Text style={s.partyDetail}>{profile.address}</Text>}
              {profile.gstin && <Text style={s.partyDetail}>GSTIN: {profile.gstin}</Text>}
            </View>
          </View>

          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={[s.tableHeaderCell, s.colNum]}>#</Text>
              <Text style={[s.tableHeaderCell, s.colDesc]}>Description</Text>
              <Text style={[s.tableHeaderCell, s.colQty]}>Qty</Text>
              <Text style={[s.tableHeaderCell, s.colRate]}>Rate</Text>
              <Text style={[s.tableHeaderCell, s.colTax]}>Tax</Text>
              <Text style={[s.tableHeaderCell, s.colAmount]}>Amount</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                <Text style={[s.tableCell, s.colNum]}>{i + 1}</Text>
                <Text style={[s.tableCellBold, s.colDesc]}>{item.description}</Text>
                <Text style={[s.tableCell, s.colQty]}>{item.qty}</Text>
                <Text style={[s.tableCell, s.colRate]}>{formatINR(Number(item.rate))}</Text>
                <Text style={[s.tableCell, s.colTax]}>{item.tax_rate}%</Text>
                <Text style={[s.tableCellBold, s.colAmount]}>{formatINR(Number(item.amount))}</Text>
              </View>
            ))}
          </View>

          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{formatINR(Number(po.subtotal))}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Tax</Text>
              <Text style={s.totalValue}>{formatINR(Number(po.total_tax))}</Text>
            </View>
            <View style={s.grandTotalRow}>
              <Text style={s.grandTotalLabel}>Grand Total</Text>
              <Text style={s.grandTotalValue}>{formatINR(Number(po.grand_total))}</Text>
            </View>
          </View>

          {po.notes && (
            <View style={s.notesSection}>
              <Text style={s.sectionLabel}>Notes</Text>
              <Text style={s.notesText}>{po.notes}</Text>
            </View>
          )}
        </View>

        <View style={s.legalFooter}>
          <Text style={s.legalText}>This is a computer-generated purchase order and does not require a physical signature.</Text>
          <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
