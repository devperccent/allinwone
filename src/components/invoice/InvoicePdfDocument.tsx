import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  Link,
} from '@react-pdf/renderer';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types';
import { INDIAN_STATES } from '@/types';

// Register Plus Jakarta Sans to match the app's system font
Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79TR_V.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KE79TR_V.ttf',
      fontWeight: 700,
    },
  ],
});

// ── Color Palette ──
const TEAL = '#03556E';
const TEAL_DARK = '#024558';
const TEAL_LIGHT = '#E8F4F8';
const TEAL_LIGHTER = '#F3FAFB';
const WHITE = '#ffffff';
const GRAY = '#6b7280';
const GRAY_DARK = '#374151';
const GRAY_LIGHT = '#9ca3af';
const BORDER = '#e5e7eb';
const GREEN = '#16a34a';
const AMBER = '#d97706';
const RED = '#dc2626';

// ── Styles ──
const s = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9.5,
    fontFamily: 'Plus Jakarta Sans',
    color: GRAY_DARK,
  },

  // ── Teal header band ──
  header: {
    backgroundColor: TEAL,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, gap: 2 },
  headerRight: { textAlign: 'right', alignItems: 'flex-end' },
  companyName: { fontSize: 17, fontWeight: 'bold', color: WHITE, marginBottom: 3 },
  headerDetail: { fontSize: 8.5, color: 'rgba(255,255,255,0.78)', marginBottom: 1.5 },
  invoiceTitle: { fontSize: 22, fontWeight: 'bold', color: WHITE, letterSpacing: 1.5 },
  invoiceNumber: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 3 },

  // ── Status pill ──
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Key-dates ribbon (right below header) ──
  ribbon: {
    backgroundColor: TEAL_DARK,
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 8,
    gap: 30,
    justifyContent: 'flex-end',
  },
  ribbonItem: { flexDirection: 'row', gap: 4 },
  ribbonLabel: { fontSize: 8, color: 'rgba(255,255,255,0.55)' },
  ribbonValue: { fontSize: 8, fontWeight: 'bold', color: WHITE },

  // ── Body wrapper ──
  body: { paddingHorizontal: 40, paddingTop: 18 },

  // ── Bill-To / Ship-To / From section ──
  parties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 20,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: TEAL_LIGHTER,
    borderRadius: 6,
    border: `0.5px solid ${BORDER}`,
  },
  partyTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: TEAL,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  partyName: { fontSize: 10.5, fontWeight: 'bold', marginBottom: 2 },
  partyDetail: { fontSize: 8.5, color: GRAY, marginBottom: 1.5, lineHeight: 1.4 },

  // ── Table ──
  table: { marginBottom: 14 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: TEAL,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  tableHeaderCell: { fontSize: 8, fontWeight: 'bold', color: WHITE, textTransform: 'uppercase', letterSpacing: 0.6 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottom: `0.5px solid ${BORDER}`,
  },
  tableRowAlt: { backgroundColor: TEAL_LIGHTER },
  tableCell: { fontSize: 9 },
  tableCellBold: { fontSize: 9, fontWeight: 'bold' },

  // Column widths
  colNum: { width: 22 },
  colDesc: { flex: 2.5 },
  colHsn: { width: 52, textAlign: 'center' },
  colQty: { width: 32, textAlign: 'right' },
  colRate: { width: 60, textAlign: 'right' },
  colDisc: { width: 50, textAlign: 'right' },
  colTax: { width: 58, textAlign: 'right' },
  colAmount: { width: 68, textAlign: 'right' },

  // ── Summary panel ──
  summaryWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  amountWordsBox: {
    flex: 1,
    paddingRight: 20,
  },
  amountWordsLabel: { fontSize: 7.5, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  amountWordsText: { fontSize: 9.5, fontStyle: 'italic', color: GRAY_DARK, lineHeight: 1.5 },

  totalsBox: {
    width: 220,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 6,
    padding: 12,
    border: `0.5px solid ${BORDER}`,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: GRAY },
  totalValue: { fontSize: 9, fontWeight: 'bold' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 6,
    borderTop: `2px solid ${TEAL}`,
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: TEAL_DARK },
  grandTotalValue: { fontSize: 14, fontWeight: 'bold', color: TEAL },

  // ── Divider ──
  divider: { borderBottom: `0.5px solid ${BORDER}`, marginVertical: 10 },

  // ── Notes ──
  notesSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 7.5, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 9, color: GRAY, lineHeight: 1.5 },

  // ── Payment / Bank / QR footer ──
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderTop: `1px solid ${BORDER}`,
  },
  bankBox: { flex: 1 },
  bankLabel: { fontSize: 8, color: GRAY_LIGHT, marginBottom: 1 },
  bankValue: { fontSize: 9, color: GRAY_DARK, marginBottom: 2 },
  qrBox: { alignItems: 'center', gap: 3 },
  qrLabel: { fontSize: 7, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 0.8 },
  qrCaption: { fontSize: 7.5, color: GRAY },

  // ── Thank you banner ──
  thankYou: {
    backgroundColor: TEAL_LIGHT,
    paddingVertical: 10,
    textAlign: 'center',
  },
  thankYouText: { fontSize: 10, fontWeight: 'bold', color: TEAL },
  thankYouSub: { fontSize: 7.5, color: GRAY, marginTop: 2 },

  // ── Legal / page footer ──
  legalFooter: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    paddingVertical: 6,
  },
  legalText: { fontSize: 7, color: GRAY_LIGHT },
  pageNumber: { fontSize: 7, color: GRAY_LIGHT, marginTop: 2 },
});

// ── Props ──
interface InvoicePdfDocumentProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile;
  qrCodeDataUrl?: string;
}

// ── Helpers ──
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  function convertSection(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertSection(n % 100) : '');
  }
  let result = '';
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const remainder = Math.floor(num % 1000);
  if (crores) result += convertSection(crores) + ' Crore ';
  if (lakhs) result += convertSection(lakhs) + ' Lakh ';
  if (thousands) result += convertSection(thousands) + ' Thousand ';
  if (remainder) result += convertSection(remainder);
  return result.trim() + ' Rupees Only';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'paid': return { backgroundColor: '#dcfce7', color: GREEN };
    case 'finalized': return { backgroundColor: '#dbeafe', color: '#2563eb' };
    case 'cancelled': return { backgroundColor: '#fee2e2', color: RED };
    default: return { backgroundColor: '#f3f4f6', color: GRAY };
  }
}

// ── Component ──
export function InvoicePdfDocument({
  invoice,
  items,
  client,
  profile,
  qrCodeDataUrl,
}: InvoicePdfDocumentProps) {
  const isIntraState = !client || profile.state_code === client.state_code;
  const statusStyle = getStatusStyle(invoice.status);

  let cgst = 0, sgst = 0, igst = 0;
  items.forEach(item => {
    const taxAmount = (Number(item.qty) * Number(item.rate) - Number(item.discount)) * (Number(item.tax_rate) / 100);
    if (isIntraState) {
      cgst += taxAmount / 2;
      sgst += taxAmount / 2;
    } else {
      igst += taxAmount;
    }
  });

  const totalItems = items.reduce((sum, i) => sum + Number(i.qty), 0);

  return (
    <Document
      title={`Invoice ${invoice.invoice_number} - ${profile.org_name}`}
      author={profile.org_name}
      subject={`Tax Invoice ${invoice.invoice_number}`}
      keywords={`invoice, ${invoice.invoice_number}, ${profile.org_name}, GST`}
      creator="InvoiceWise"
    >
      <Page size="A4" style={s.page}>
        {/* ═══ HEADER ═══ */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {profile.logo_url && (
              <Image src={profile.logo_url} style={{ width: 46, height: 46, marginBottom: 5, objectFit: 'contain' }} />
            )}
            <Text style={s.companyName}>{profile.org_name}</Text>
            {profile.address && <Text style={s.headerDetail}>{profile.address}</Text>}
            {profile.gstin && <Text style={s.headerDetail}>GSTIN: {profile.gstin}</Text>}
            {profile.phone && <Text style={s.headerDetail}>Phone: {profile.phone}</Text>}
            {profile.email && <Text style={s.headerDetail}>Email: {profile.email}</Text>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>TAX INVOICE</Text>
            <Text style={s.invoiceNumber}>{invoice.invoice_number}</Text>
            <View style={[s.statusBadge, statusStyle]}>
              <Text>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* ═══ DATE RIBBON ═══ */}
        <View style={s.ribbon}>
          <View style={s.ribbonItem}>
            <Text style={s.ribbonLabel}>Issued:</Text>
            <Text style={s.ribbonValue}>{formatDate(invoice.date_issued)}</Text>
          </View>
          {invoice.date_due && (
            <View style={s.ribbonItem}>
              <Text style={s.ribbonLabel}>Due:</Text>
              <Text style={s.ribbonValue}>{formatDate(invoice.date_due)}</Text>
            </View>
          )}
          <View style={s.ribbonItem}>
            <Text style={s.ribbonLabel}>Supply:</Text>
            <Text style={s.ribbonValue}>
              {client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profile.state_code]}
            </Text>
          </View>
          <View style={s.ribbonItem}>
            <Text style={s.ribbonLabel}>Type:</Text>
            <Text style={s.ribbonValue}>{isIntraState ? 'Intra-State' : 'Inter-State'}</Text>
          </View>
        </View>

        {/* ═══ BILL-TO & FROM ═══ */}
        <View style={s.body}>
          <View style={s.parties}>
            <View style={s.partyBox}>
              <Text style={s.partyTitle}>Bill To</Text>
              {client ? (
                <>
                  <Text style={s.partyName}>{client.name}</Text>
                  {client.billing_address && <Text style={s.partyDetail}>{client.billing_address}</Text>}
                  {client.gstin && <Text style={s.partyDetail}>GSTIN: {client.gstin}</Text>}
                  <Text style={s.partyDetail}>
                    State: {INDIAN_STATES[client.state_code]} ({client.state_code})
                  </Text>
                  {client.phone && <Text style={s.partyDetail}>Phone: {client.phone}</Text>}
                  {client.email && <Text style={s.partyDetail}>Email: {client.email}</Text>}
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
              <Text style={s.partyDetail}>
                State: {INDIAN_STATES[profile.state_code]} ({profile.state_code})
              </Text>
            </View>
          </View>

          {/* ═══ ITEMS TABLE ═══ */}
          <View style={s.table}>
            {/* Table header */}
            <View style={s.tableHeaderRow}>
              <Text style={[s.tableHeaderCell, s.colNum]}>#</Text>
              <Text style={[s.tableHeaderCell, s.colDesc]}>Description</Text>
              <Text style={[s.tableHeaderCell, s.colHsn]}>HSN</Text>
              <Text style={[s.tableHeaderCell, s.colQty]}>Qty</Text>
              <Text style={[s.tableHeaderCell, s.colRate]}>Rate</Text>
              <Text style={[s.tableHeaderCell, s.colDisc]}>Disc.</Text>
              {isIntraState ? (
                <>
                  <Text style={[s.tableHeaderCell, s.colTax]}>CGST</Text>
                  <Text style={[s.tableHeaderCell, s.colTax]}>SGST</Text>
                </>
              ) : (
                <Text style={[s.tableHeaderCell, s.colTax]}>IGST</Text>
              )}
              <Text style={[s.tableHeaderCell, s.colAmount]}>Amount</Text>
            </View>

            {/* Table rows */}
            {items.map((item, index) => {
              const baseAmount = Number(item.qty) * Number(item.rate);
              const discount = Number(item.discount);
              const taxAmount = (baseAmount - discount) * (Number(item.tax_rate) / 100);
              const totalAmount = baseAmount - discount + taxAmount;
              const isAlt = index % 2 === 1;

              return (
                <View key={index} style={[s.tableRow, isAlt && s.tableRowAlt]}>
                  <Text style={[s.tableCell, s.colNum]}>{index + 1}</Text>
                  <View style={s.colDesc}>
                    <Text style={s.tableCellBold}>{item.description}</Text>
                    {item.product_id && item.product && (
                      <Text style={{ fontSize: 7, color: GRAY_LIGHT, marginTop: 1 }}>
                        SKU: {item.product.sku}
                      </Text>
                    )}
                  </View>
                  <Text style={[s.tableCell, s.colHsn, { color: GRAY }]}>
                    {item.product?.hsn_code || '—'}
                  </Text>
                  <Text style={[s.tableCell, s.colQty]}>{item.qty}</Text>
                  <Text style={[s.tableCell, s.colRate]}>{formatINR(Number(item.rate))}</Text>
                  <Text style={[s.tableCell, s.colDisc, { color: discount > 0 ? GREEN : GRAY_LIGHT }]}>
                    {discount > 0 ? `-${formatINR(discount)}` : '—'}
                  </Text>
                  {isIntraState ? (
                    <>
                      <Text style={[s.tableCell, s.colTax]}>
                        {formatINR(taxAmount / 2)}{'\n'}
                        <Text style={{ fontSize: 7, color: GRAY_LIGHT }}>@{Number(item.tax_rate) / 2}%</Text>
                      </Text>
                      <Text style={[s.tableCell, s.colTax]}>
                        {formatINR(taxAmount / 2)}{'\n'}
                        <Text style={{ fontSize: 7, color: GRAY_LIGHT }}>@{Number(item.tax_rate) / 2}%</Text>
                      </Text>
                    </>
                  ) : (
                    <Text style={[s.tableCell, s.colTax]}>
                      {formatINR(taxAmount)}{'\n'}
                      <Text style={{ fontSize: 7, color: GRAY_LIGHT }}>@{item.tax_rate}%</Text>
                    </Text>
                  )}
                  <Text style={[s.tableCellBold, s.colAmount]}>{formatINR(totalAmount)}</Text>
                </View>
              );
            })}

            {/* Items summary row */}
            <View style={{ flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, backgroundColor: TEAL_LIGHT, borderRadius: 3, marginTop: 2 }}>
              <Text style={{ fontSize: 8, color: TEAL, fontWeight: 'bold' }}>
                {items.length} item{items.length !== 1 ? 's' : ''} | {totalItems} unit{totalItems !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* ═══ SUMMARY (Amount in Words + Totals) ═══ */}
          <View style={s.summaryWrapper}>
            <View style={s.amountWordsBox}>
              <Text style={s.amountWordsLabel}>Amount in Words</Text>
              <Text style={s.amountWordsText}>{numberToWords(Number(invoice.grand_total))}</Text>
              {invoice.payment_mode && (
                <View style={{ marginTop: 8 }}>
                  <Text style={s.amountWordsLabel}>Payment Mode</Text>
                  <Text style={[s.amountWordsText, { fontStyle: 'normal', fontWeight: 'bold' }]}>
                    {invoice.payment_mode.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={s.totalsBox}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{formatINR(Number(invoice.subtotal))}</Text>
              </View>
              {Number(invoice.total_discount) > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Discount</Text>
                  <Text style={[s.totalValue, { color: GREEN }]}>-{formatINR(Number(invoice.total_discount))}</Text>
                </View>
              )}
              {isIntraState ? (
                <>
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>CGST</Text>
                    <Text style={s.totalValue}>{formatINR(cgst)}</Text>
                  </View>
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>SGST</Text>
                    <Text style={s.totalValue}>{formatINR(sgst)}</Text>
                  </View>
                </>
              ) : (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>IGST</Text>
                  <Text style={s.totalValue}>{formatINR(igst)}</Text>
                </View>
              )}
              <View style={s.grandTotalRow}>
                <Text style={s.grandTotalLabel}>Grand Total</Text>
                <Text style={s.grandTotalValue}>{formatINR(Number(invoice.grand_total))}</Text>
              </View>
            </View>
          </View>

          {/* ═══ NOTES ═══ */}
          {invoice.notes && (
            <View style={s.notesSection}>
              <Text style={s.sectionLabel}>Notes & Terms</Text>
              <Text style={s.notesText}>{invoice.notes}</Text>
            </View>
          )}
        </View>

        {/* ═══ PAYMENT FOOTER (Bank + QR) ═══ */}
        <View style={s.paymentFooter}>
          <View style={s.bankBox}>
            <Text style={s.sectionLabel}>Payment Information</Text>
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 4, flexWrap: 'wrap' }}>
              {profile.bank_account_name && (
                <View>
                  <Text style={s.bankLabel}>Account Name</Text>
                  <Text style={s.bankValue}>{profile.bank_account_name}</Text>
                </View>
              )}
              {profile.bank_account_number && (
                <View>
                  <Text style={s.bankLabel}>Account No.</Text>
                  <Text style={s.bankValue}>{profile.bank_account_number}</Text>
                </View>
              )}
              {profile.bank_ifsc && (
                <View>
                  <Text style={s.bankLabel}>IFSC</Text>
                  <Text style={s.bankValue}>{profile.bank_ifsc}</Text>
                </View>
              )}
              {profile.upi_vpa && (
                <View>
                  <Text style={s.bankLabel}>UPI ID</Text>
                  <Text style={s.bankValue}>{profile.upi_vpa}</Text>
                </View>
              )}
              {profile.email && !profile.bank_account_name && (
                <View>
                  <Text style={s.bankLabel}>Email</Text>
                  <Text style={s.bankValue}>{profile.email}</Text>
                </View>
              )}
            </View>
          </View>
          {qrCodeDataUrl && (
            <View style={s.qrBox}>
              <Text style={s.qrLabel}>Scan to Pay</Text>
              <Image src={qrCodeDataUrl} style={{ width: 76, height: 76, borderRadius: 4 }} />
              <Text style={s.qrCaption}>UPI Payment</Text>
            </View>
          )}
        </View>

        {/* ═══ THANK YOU BANNER ═══ */}
        <View style={s.thankYou}>
          <Text style={s.thankYouText}>Thank you for your business!</Text>
          <Text style={s.thankYouSub}>
            If you have any questions about this invoice, please contact {profile.email || profile.phone || profile.org_name}
          </Text>
        </View>

        {/* ═══ LEGAL FOOTER ═══ */}
        <View style={s.legalFooter}>
          <Text style={s.legalText}>
            This is a computer-generated invoice and does not require a physical signature.
          </Text>
          <Text
            style={s.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
