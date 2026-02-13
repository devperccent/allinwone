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

// Deep Teal primary color matching the app theme
const TEAL = '#03556E';
const TEAL_LIGHT = '#E8F4F8';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: 'Plus Jakarta Sans',
    color: '#1a1a2e',
  },
  // Header - matches the teal header bar in the preview
  header: {
    backgroundColor: TEAL,
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerDetail: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  headerRight: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  invoiceNumber: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Body content
  body: {
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  // Bill To & Invoice Info row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: `1px solid ${BORDER}`,
  },
  column: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: GRAY,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 3,
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: `1px solid ${BORDER}50`,
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellBold: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  colNum: { width: 25 },
  colDescription: { flex: 3 },
  colQty: { width: 45, textAlign: 'right' },
  colRate: { width: 75, textAlign: 'right' },
  colTax: { width: 70, textAlign: 'right' },
  colAmount: { width: 80, textAlign: 'right' },
  // Totals section - matches the muted bg from preview
  totalsWrapper: {
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  totalsSection: {
    marginLeft: 'auto',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: GRAY,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotal: {
    borderTop: `2px solid ${TEAL}`,
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEAL,
  },
  amountInWords: {
    marginTop: 8,
    fontSize: 9,
    fontStyle: 'italic',
    color: GRAY,
  },
  // Footer
  footerArea: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderTop: `1px solid ${BORDER}`,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: GRAY,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: GRAY,
  },
  footerText: {
    fontSize: 9,
    color: GRAY,
  },
  qrSection: {
    alignItems: 'center',
  },
  legalFooter: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: GRAY,
    backgroundColor: TEAL_LIGHT,
    paddingVertical: 10,
  },
  notes: {
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
});

interface InvoicePdfDocumentProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile;
  qrCodeDataUrl?: string;
}

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

export function InvoicePdfDocument({
  invoice,
  items,
  client,
  profile,
  qrCodeDataUrl,
}: InvoicePdfDocumentProps) {
  const isIntraState = !client || profile.state_code === client.state_code;

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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Teal Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {profile.logo_url && (
              <Image src={profile.logo_url} style={{ width: 48, height: 48, marginBottom: 6, objectFit: 'contain' }} />
            )}
            <Text style={styles.companyName}>{profile.org_name}</Text>
            {profile.address && <Text style={styles.headerDetail}>{profile.address}</Text>}
            {profile.gstin && <Text style={styles.headerDetail}>GSTIN: {profile.gstin}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.body}>
          <View style={styles.infoRow}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              {client ? (
                <>
                  <Text style={[styles.value, { fontWeight: 'bold' }]}>{client.name}</Text>
                  <Text style={styles.value}>{client.billing_address}</Text>
                  {client.gstin && <Text style={styles.value}>GSTIN: {client.gstin}</Text>}
                  <Text style={styles.value}>
                    State: {INDIAN_STATES[client.state_code]} ({client.state_code})
                  </Text>
                </>
              ) : (
                <Text style={[styles.value, { fontStyle: 'italic', color: GRAY }]}>Walk-in Customer</Text>
              )}
            </View>
            <View style={styles.columnRight}>
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.label}>Date</Text>
                <Text style={[styles.value, { fontWeight: 'bold' }]}>{invoice.date_issued}</Text>
              </View>
              {invoice.date_due && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.label}>Due</Text>
                  <Text style={[styles.value, { fontWeight: 'bold' }]}>{invoice.date_due}</Text>
                </View>
              )}
              <View>
                <Text style={styles.label}>Place of Supply</Text>
                <Text style={[styles.value, { fontWeight: 'bold' }]}>
                  {client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profile.state_code]}
                </Text>
              </View>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellBold, styles.colNum]}>#</Text>
              <Text style={[styles.tableCellBold, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableCellBold, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableCellBold, styles.colRate]}>Rate</Text>
              {isIntraState ? (
                <>
                  <Text style={[styles.tableCellBold, styles.colTax]}>CGST</Text>
                  <Text style={[styles.tableCellBold, styles.colTax]}>SGST</Text>
                </>
              ) : (
                <Text style={[styles.tableCellBold, styles.colTax]}>IGST</Text>
              )}
              <Text style={[styles.tableCellBold, styles.colAmount]}>Amount</Text>
            </View>

            {items.map((item, index) => {
              const baseAmount = Number(item.qty) * Number(item.rate);
              const taxAmount = (baseAmount - Number(item.discount)) * (Number(item.tax_rate) / 100);
              const totalAmount = baseAmount - Number(item.discount) + taxAmount;

              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colNum]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
                  <Text style={[styles.tableCell, styles.colRate]}>{formatINR(Number(item.rate))}</Text>
                  {isIntraState ? (
                    <>
                      <Text style={[styles.tableCell, styles.colTax]}>{formatINR(taxAmount / 2)}</Text>
                      <Text style={[styles.tableCell, styles.colTax]}>{formatINR(taxAmount / 2)}</Text>
                    </>
                  ) : (
                    <Text style={[styles.tableCell, styles.colTax]}>{formatINR(taxAmount)}</Text>
                  )}
                  <Text style={[styles.tableCell, styles.colAmount, { fontWeight: 'bold' }]}>{formatINR(totalAmount)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals - teal tinted background matching preview */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatINR(Number(invoice.subtotal))}</Text>
            </View>
            {Number(invoice.total_discount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>-{formatINR(Number(invoice.total_discount))}</Text>
              </View>
            )}
            {isIntraState ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST</Text>
                  <Text style={styles.totalValue}>{formatINR(cgst)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST</Text>
                  <Text style={styles.totalValue}>{formatINR(sgst)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST</Text>
                <Text style={styles.totalValue}>{formatINR(igst)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatINR(Number(invoice.grand_total))}</Text>
            </View>
          </View>
          <Text style={styles.amountInWords}>
            Amount in words: {numberToWords(Number(invoice.grand_total))}
          </Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer with bank details & QR */}
        <View style={styles.footerArea}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.notesTitle}>Bank Details</Text>
              <Text style={styles.footerText}>Account Name: {profile.org_name}</Text>
              {profile.upi_vpa && <Text style={styles.footerText}>UPI: {profile.upi_vpa}</Text>}
            </View>
            {qrCodeDataUrl && (
              <View style={styles.qrSection}>
                <Image src={qrCodeDataUrl} style={{ width: 80, height: 80 }} />
                <Text style={styles.footerText}>Scan to Pay</Text>
              </View>
            )}
          </View>
        </View>

        {/* Legal footer */}
        <View style={styles.legalFooter}>
          <Text>This is a computer-generated invoice and does not require a signature.</Text>
        </View>
      </Page>
    </Document>
  );
}
