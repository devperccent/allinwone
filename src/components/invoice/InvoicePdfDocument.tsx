import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types';
import { INDIAN_STATES } from '@/types';
import type { InvoiceTemplate } from './invoiceTemplates';
import { TEMPLATE_PALETTES } from './invoiceTemplates';

// Register Plus Jakarta Sans
Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79TR_V.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_m0n9TR_V.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KE79TR_V.ttf', fontWeight: 700 },
  ],
});

const GRAY_900 = '#111827';
const GRAY_700 = '#374151';
const GRAY_500 = '#6b7280';
const GRAY_400 = '#9ca3af';
const GRAY_200 = '#e5e7eb';
const GRAY_100 = '#f3f4f6';
const GREEN = '#059669';
const WHITE = '#ffffff';

function createStyles(p: ReturnType<typeof getPalette>) {
  return StyleSheet.create({
    page: { padding: 0, fontSize: 9, fontFamily: 'Plus Jakarta Sans', color: GRAY_700 },
    accentBar: { height: p.showAccentBar ? 4 : 2, backgroundColor: p.accent },
    header: { paddingHorizontal: 40, paddingTop: 24, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerLeft: { flex: 1, gap: 1 },
    headerRight: { textAlign: 'right', alignItems: 'flex-end' },
    companyName: { fontSize: 18, fontWeight: 700, color: GRAY_900, marginBottom: 4 },
    headerDetail: { fontSize: 8, color: GRAY_500, lineHeight: 1.5 },
    invoiceLabel: { fontSize: 8, color: GRAY_400, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
    invoiceTitle: { fontSize: 26, fontWeight: 700, color: p.accent, letterSpacing: 0.5 },
    invoiceNumber: { fontSize: 10, color: GRAY_500, marginTop: 3, fontWeight: 600 },
    statusBadge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3.5, borderRadius: p.fontStyle === 'modern' ? 12 : p.fontStyle === 'serif' ? 0 : 2, fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 },
    metaStrip: { flexDirection: 'row', paddingHorizontal: 40, paddingVertical: 10, backgroundColor: p.fontStyle === 'serif' ? p.accentLight : GRAY_100, borderTop: `0.5px solid ${GRAY_200}`, borderBottom: `0.5px solid ${GRAY_200}`, justifyContent: 'space-between' },
    metaItem: { flex: 1, alignItems: p.fontStyle === 'clean' ? 'flex-start' : 'center' },
    metaLabel: { fontSize: 7, color: GRAY_400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    metaValue: { fontSize: 8.5, fontWeight: 700, color: GRAY_900 },
    metaDivider: { width: 0.5, backgroundColor: GRAY_200 },
    body: { paddingHorizontal: 40, paddingTop: 20 },
    parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22, gap: 16 },
    partyBox: { flex: 1, padding: 14, backgroundColor: WHITE, borderRadius: p.borderRadiusPdf, border: `1px solid ${GRAY_200}` },
    partyBoxAccent: { borderLeft: p.fontStyle !== 'clean' ? `3px solid ${p.accent}` : `1px solid ${GRAY_200}` },
    partyTitle: { fontSize: 7, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
    partyName: { fontSize: 11, fontWeight: 700, color: GRAY_900, marginBottom: 3 },
    partyDetail: { fontSize: 8, color: GRAY_500, marginBottom: 1.5, lineHeight: 1.5 },
    table: { marginBottom: 16 },
    tableHeaderRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: p.tableStyle === 'minimal' ? 'transparent' : p.tableHeaderBg, borderRadius: p.borderRadiusPdf, borderBottom: p.tableStyle === 'minimal' ? `1.5px solid ${GRAY_900}` : 'none' },
    tableHeaderCell: { fontSize: 7.5, fontWeight: 700, color: p.tableStyle === 'minimal' ? GRAY_900 : p.tableHeaderText, textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottom: `0.5px solid ${GRAY_200}` },
    tableRowAlt: { backgroundColor: p.tableStyle === 'filled' ? p.tableAltBg : 'transparent' },
    tableCell: { fontSize: 8.5 },
    tableCellBold: { fontSize: 8.5, fontWeight: 600 },
    tableCellSub: { fontSize: 6.5, color: GRAY_400, marginTop: 1 },
    colNum: { width: 22 },
    colDesc: { flex: 2.5 },
    colHsn: { width: 48, textAlign: 'center' },
    colQty: { width: 30, textAlign: 'right' },
    colRate: { width: 58, textAlign: 'right' },
    colDisc: { width: 48, textAlign: 'right' },
    colTax: { width: 55, textAlign: 'right' },
    colAmount: { width: 65, textAlign: 'right' },
    itemsSummary: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: p.accentLight, borderRadius: p.borderRadiusPdf, marginTop: 3, justifyContent: 'space-between' },
    summaryWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, gap: 16 },
    amountWordsBox: { flex: 1, paddingRight: 12 },
    amountWordsLabel: { fontSize: 7, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5 },
    amountWordsText: { fontSize: 9.5, fontStyle: 'italic', color: GRAY_700, lineHeight: 1.6 },
    totalsBox: { width: 210, padding: 14, backgroundColor: WHITE, borderRadius: p.borderRadiusPdf, border: `1px solid ${GRAY_200}` },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5 },
    totalLabel: { fontSize: 8.5, color: GRAY_500 },
    totalValue: { fontSize: 8.5, fontWeight: 600, color: GRAY_700 },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 8, borderTop: `2px solid ${p.accent}` },
    grandTotalLabel: { fontSize: 11, fontWeight: 700, color: GRAY_900 },
    grandTotalValue: { fontSize: 14, fontWeight: 700, color: p.accent },
    notesSection: { marginBottom: 16 },
    sectionLabel: { fontSize: 7, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5 },
    notesText: { fontSize: 8.5, color: GRAY_500, lineHeight: 1.6 },
    signatureSection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16, marginTop: 4 },
    signatureBox: { width: 180, alignItems: 'center' },
    signatureLine: { width: '100%', borderBottom: `1px solid ${GRAY_700}`, marginBottom: 6, marginTop: 40 },
    signatureText: { fontSize: 7.5, color: GRAY_500 },
    signatureName: { fontSize: 8, fontWeight: 600, color: GRAY_700, marginTop: 2 },
    paymentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 40, paddingVertical: 16, backgroundColor: GRAY_100, borderTop: `1px solid ${GRAY_200}` },
    bankBox: { flex: 1 },
    bankLabel: { fontSize: 7.5, color: GRAY_400, marginBottom: 1 },
    bankValue: { fontSize: 8.5, color: GRAY_700, fontWeight: 600, marginBottom: 3 },
    qrBox: { alignItems: 'center', gap: 3 },
    qrLabel: { fontSize: 7, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
    qrCaption: { fontSize: 7, color: GRAY_400 },
    thankYou: { backgroundColor: p.accent, paddingVertical: 12, textAlign: 'center' },
    thankYouText: { fontSize: 10, fontWeight: 600, color: WHITE, letterSpacing: 0.3 },
    thankYouSub: { fontSize: 7.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    legalFooter: { position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center' },
    legalText: { fontSize: 6.5, color: GRAY_400 },
    pageNumber: { fontSize: 6.5, color: GRAY_400, marginTop: 2 },
  });
}

function getPalette(template: InvoiceTemplate) {
  return TEMPLATE_PALETTES[template];
}

interface InvoicePdfDocumentProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile;
  qrCodeDataUrl?: string;
  showPaymentInfo?: boolean;
  template?: InvoiceTemplate;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
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
  } catch { return dateStr; }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'paid': return { backgroundColor: '#dcfce7', color: GREEN };
    case 'finalized': return { backgroundColor: '#dbeafe', color: '#2563eb' };
    case 'cancelled': return { backgroundColor: '#fee2e2', color: '#dc2626' };
    default: return { backgroundColor: GRAY_100, color: GRAY_500 };
  }
}

export function InvoicePdfDocument({
  invoice, items, client, profile, qrCodeDataUrl, showPaymentInfo = true, template = 'modern',
}: InvoicePdfDocumentProps) {
  const pal = getPalette(template);
  const s = createStyles(pal);
  const isIntraState = !client || profile.state_code === client.state_code;
  const statusStyle = getStatusStyle(invoice.status);

  let cgst = 0, sgst = 0, igst = 0;
  items.forEach(item => {
    const taxAmount = (Number(item.qty) * Number(item.rate) - Number(item.discount)) * (Number(item.tax_rate) / 100);
    if (isIntraState) { cgst += taxAmount / 2; sgst += taxAmount / 2; } else { igst += taxAmount; }
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
        {/* ACCENT BAR */}
        {(pal.showAccentBar || template === 'classic') && <View style={s.accentBar} />}

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {profile.logo_url && (
              <Image src={profile.logo_url} style={{ width: 48, height: 48, marginBottom: 6, objectFit: 'contain' }} />
            )}
            <Text style={s.companyName}>{profile.org_name}</Text>
            {profile.address && <Text style={s.headerDetail}>{profile.address}</Text>}
            {profile.gstin && <Text style={s.headerDetail}>GSTIN: {profile.gstin}</Text>}
            {profile.pan_number && <Text style={s.headerDetail}>PAN: {profile.pan_number}</Text>}
            {profile.phone && <Text style={s.headerDetail}>Phone: {profile.phone}</Text>}
            {profile.email && <Text style={s.headerDetail}>Email: {profile.email}</Text>}
          </View>
          <View style={s.headerRight}>
            {template === 'minimal' ? (
              <>
                <Text style={[s.invoiceTitle, { fontSize: 22, fontWeight: 400, letterSpacing: 4 }]}>INVOICE</Text>
                <Text style={s.invoiceNumber}>{invoice.invoice_number}</Text>
              </>
            ) : template === 'classic' ? (
              <>
                <Text style={[s.invoiceTitle, { fontSize: 22, letterSpacing: 2 }]}>TAX INVOICE</Text>
                <View style={{ marginTop: 3, paddingBottom: 2, borderBottom: `2px solid ${pal.accent}` }}>
                  <Text style={s.invoiceNumber}>{invoice.invoice_number}</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={s.invoiceLabel}>Invoice</Text>
                <Text style={s.invoiceTitle}>TAX INVOICE</Text>
                <Text style={s.invoiceNumber}>{invoice.invoice_number}</Text>
              </>
            )}
            <View style={[s.statusBadge, statusStyle]}>
              <Text>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* META STRIP */}
        <View style={s.metaStrip}>
          {[
            { label: 'Date Issued', value: formatDate(invoice.date_issued) },
            { label: 'Due Date', value: invoice.date_due ? formatDate(invoice.date_due) : '—' },
            { label: 'Place of Supply', value: client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profile.state_code] },
            { label: 'Supply Type', value: isIntraState ? 'Intra-State' : 'Inter-State' },
          ].map((m, i, arr) => (
            <View key={m.label} style={{ flexDirection: 'row', flex: 1 }}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>{m.label}</Text>
                <Text style={s.metaValue}>{m.value}</Text>
              </View>
              {template !== 'minimal' && i < arr.length - 1 && <View style={s.metaDivider} />}
            </View>
          ))}
        </View>

        {/* BILL TO & FROM */}
        <View style={s.body}>
          <View style={s.parties}>
            <View style={[s.partyBox, s.partyBoxAccent]}>
              <Text style={s.partyTitle}>Bill To</Text>
              {client ? (
                <>
                  <Text style={s.partyName}>{client.name}</Text>
                  {client.billing_address && <Text style={s.partyDetail}>{client.billing_address}</Text>}
                  {client.gstin && <Text style={s.partyDetail}>GSTIN: {client.gstin}</Text>}
                  <Text style={s.partyDetail}>State: {INDIAN_STATES[client.state_code]} ({client.state_code})</Text>
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
              <Text style={s.partyDetail}>State: {INDIAN_STATES[profile.state_code]} ({profile.state_code})</Text>
            </View>
          </View>

          {/* ITEMS TABLE */}
          <View style={s.table}>
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

            {items.map((item, index) => {
              const baseAmount = Number(item.qty) * Number(item.rate);
              const discount = Number(item.discount);
              const taxAmount = (baseAmount - discount) * (Number(item.tax_rate) / 100);
              const totalAmount = baseAmount - discount + taxAmount;
              const isAlt = index % 2 === 1;

              return (
                <View key={index} style={[s.tableRow, isAlt && s.tableRowAlt]}>
                  <Text style={[s.tableCell, s.colNum, { color: GRAY_400 }]}>{index + 1}</Text>
                  <View style={s.colDesc}>
                    <Text style={s.tableCellBold}>{item.description}</Text>
                    {item.product_id && item.product && (
                      <Text style={s.tableCellSub}>SKU: {item.product.sku}</Text>
                    )}
                  </View>
                  <Text style={[s.tableCell, s.colHsn, { color: GRAY_500, fontSize: 8 }]}>
                    {item.product?.hsn_code || '—'}
                  </Text>
                  <Text style={[s.tableCellBold, s.colQty]}>{item.qty}</Text>
                  <Text style={[s.tableCell, s.colRate]}>{formatINR(Number(item.rate))}</Text>
                  <Text style={[s.tableCell, s.colDisc, { color: discount > 0 ? GREEN : GRAY_400 }]}>
                    {discount > 0 ? `-${formatINR(discount)}` : '—'}
                  </Text>
                  {isIntraState ? (
                    <>
                      <Text style={[s.tableCell, s.colTax]}>
                        {formatINR(taxAmount / 2)}{'\n'}
                        <Text style={s.tableCellSub}>@{Number(item.tax_rate) / 2}%</Text>
                      </Text>
                      <Text style={[s.tableCell, s.colTax]}>
                        {formatINR(taxAmount / 2)}{'\n'}
                        <Text style={s.tableCellSub}>@{Number(item.tax_rate) / 2}%</Text>
                      </Text>
                    </>
                  ) : (
                    <Text style={[s.tableCell, s.colTax]}>
                      {formatINR(taxAmount)}{'\n'}
                      <Text style={s.tableCellSub}>@{item.tax_rate}%</Text>
                    </Text>
                  )}
                  <Text style={[s.tableCellBold, s.colAmount]}>{formatINR(totalAmount)}</Text>
                </View>
              );
            })}

            {/* Items summary - only for non-minimal */}
            {template !== 'minimal' && (
              <View style={s.itemsSummary}>
                <Text style={{ fontSize: 7.5, color: pal.accent, fontWeight: 600 }}>
                  {items.length} item{items.length !== 1 ? 's' : ''} · {totalItems} unit{totalItems !== 1 ? 's' : ''}
                </Text>
                <Text style={{ fontSize: 7.5, color: GRAY_500 }}>
                  Taxable: {formatINR(Number(invoice.subtotal) - Number(invoice.total_discount))}
                </Text>
              </View>
            )}
          </View>

          {/* SUMMARY */}
          <View style={s.summaryWrapper}>
            <View style={s.amountWordsBox}>
              <Text style={s.amountWordsLabel}>Amount in Words</Text>
              <Text style={s.amountWordsText}>{numberToWords(Number(invoice.grand_total))}</Text>
              {invoice.payment_mode && (
                <View style={{ marginTop: 10 }}>
                  <Text style={s.amountWordsLabel}>Payment Mode</Text>
                  <Text style={[s.amountWordsText, { fontStyle: 'normal', fontWeight: 600 }]}>
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

          {/* NOTES */}
          {invoice.notes && (
            <View style={s.notesSection}>
              <Text style={s.sectionLabel}>Notes & Terms</Text>
              <Text style={s.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* AUTHORIZED SIGNATORY */}
          <View style={s.signatureSection}>
            <View style={s.signatureBox}>
              {profile.signature_url ? (
                <Image src={profile.signature_url} style={{ width: 120, height: 50, objectFit: 'contain', marginTop: 10, marginBottom: 6 }} />
              ) : (
                <View style={s.signatureLine} />
              )}
              <Text style={s.signatureText}>Authorized Signatory</Text>
              <Text style={s.signatureName}>{profile.org_name}</Text>
            </View>
          </View>
        </View>

        {/* PAYMENT FOOTER */}
        {showPaymentInfo && (
          <View style={s.paymentFooter}>
            <View style={s.bankBox}>
              <Text style={s.sectionLabel}>Payment Information</Text>
              <View style={{ flexDirection: 'row', gap: 20, marginTop: 4, flexWrap: 'wrap' }}>
                {profile.bank_account_name && (
                  <View><Text style={s.bankLabel}>Account Name</Text><Text style={s.bankValue}>{profile.bank_account_name}</Text></View>
                )}
                {profile.bank_account_number && (
                  <View><Text style={s.bankLabel}>Account No.</Text><Text style={s.bankValue}>{profile.bank_account_number}</Text></View>
                )}
                {profile.bank_ifsc && (
                  <View><Text style={s.bankLabel}>IFSC</Text><Text style={s.bankValue}>{profile.bank_ifsc}</Text></View>
                )}
                {profile.upi_vpa && (
                  <View><Text style={s.bankLabel}>UPI ID</Text><Text style={s.bankValue}>{profile.upi_vpa}</Text></View>
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
        )}

        {/* THANK YOU BANNER */}
        {pal.showThankYou && (
          <View style={s.thankYou}>
            <Text style={s.thankYouText}>Thank you for your business!</Text>
            <Text style={s.thankYouSub}>Questions? Contact {profile.email || profile.phone || profile.org_name}</Text>
          </View>
        )}

        {/* LEGAL FOOTER */}
        <View style={s.legalFooter}>
          <Text style={s.legalText}>This is a computer-generated invoice and does not require a physical signature.</Text>
          <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
