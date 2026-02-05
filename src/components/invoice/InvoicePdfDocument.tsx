import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types';
import { INDIAN_STATES } from '@/types';

// Register font (using default for now)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/helvetica.woff2' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #4f46e5',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
    textAlign: 'right',
  },
  label: {
    fontSize: 9,
    color: '#888',
    marginBottom: 3,
  },
  value: {
    fontSize: 11,
    marginBottom: 3,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderBottom: '1px solid #e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #f0f0f0',
  },
  tableCell: {
    fontSize: 10,
  },
  colDescription: { flex: 3 },
  colQty: { width: 50, textAlign: 'center' },
  colRate: { width: 80, textAlign: 'right' },
  colTax: { width: 60, textAlign: 'right' },
  colAmount: { width: 80, textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotal: {
    borderTop: '2px solid #4f46e5',
    paddingTop: 10,
    marginTop: 10,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTop: '1px solid #e0e0e0',
  },
  footerText: {
    fontSize: 9,
    color: '#888',
  },
  qrSection: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    marginBottom: 5,
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#666',
  },
  amountInWords: {
    marginTop: 10,
    fontSize: 9,
    fontStyle: 'italic',
    color: '#666',
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
  
  // Calculate tax totals
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{profile.org_name}</Text>
            <Text style={styles.value}>{profile.address}</Text>
            {profile.gstin && <Text style={styles.value}>GSTIN: {profile.gstin}</Text>}
            <Text style={styles.value}>
              {profile.email} | {profile.phone}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            {client ? (
              <>
                <Text style={styles.value}>{client.name}</Text>
                <Text style={styles.value}>{client.billing_address}</Text>
                {client.gstin && <Text style={styles.value}>GSTIN: {client.gstin}</Text>}
                <Text style={styles.value}>
                  State: {INDIAN_STATES[client.state_code]} ({client.state_code})
                </Text>
              </>
            ) : (
              <Text style={styles.value}>Walk-in Customer</Text>
            )}
          </View>
          <View style={styles.columnRight}>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>{invoice.date_issued}</Text>
            </View>
            {invoice.date_due && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Due Date</Text>
                <Text style={styles.value}>{invoice.date_due}</Text>
              </View>
            )}
            <View>
              <Text style={styles.label}>Place of Supply</Text>
              <Text style={styles.value}>
                {client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profile.state_code]}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colDescription, { fontWeight: 'bold' }]}>
              Description
            </Text>
            <Text style={[styles.tableCell, styles.colQty, { fontWeight: 'bold' }]}>Qty</Text>
            <Text style={[styles.tableCell, styles.colRate, { fontWeight: 'bold' }]}>Rate</Text>
            {isIntraState ? (
              <>
                <Text style={[styles.tableCell, styles.colTax, { fontWeight: 'bold' }]}>CGST</Text>
                <Text style={[styles.tableCell, styles.colTax, { fontWeight: 'bold' }]}>SGST</Text>
              </>
            ) : (
              <Text style={[styles.tableCell, styles.colTax, { fontWeight: 'bold' }]}>IGST</Text>
            )}
            <Text style={[styles.tableCell, styles.colAmount, { fontWeight: 'bold' }]}>Amount</Text>
          </View>

          {items.map((item, index) => {
            const baseAmount = Number(item.qty) * Number(item.rate);
            const taxAmount = (baseAmount - Number(item.discount)) * (Number(item.tax_rate) / 100);
            const totalAmount = baseAmount - Number(item.discount) + taxAmount;

            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>{formatINR(Number(item.rate))}</Text>
                {isIntraState ? (
                  <>
                    <Text style={[styles.tableCell, styles.colTax]}>
                      {formatINR(taxAmount / 2)}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTax]}>
                      {formatINR(taxAmount / 2)}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.tableCell, styles.colTax]}>{formatINR(taxAmount)}</Text>
                )}
                <Text style={[styles.tableCell, styles.colAmount]}>{formatINR(totalAmount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatINR(Number(invoice.subtotal))}</Text>
          </View>
          {Number(invoice.total_discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-{formatINR(Number(invoice.total_discount))}</Text>
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

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes / Terms</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.notesTitle}>Bank Details</Text>
              <Text style={styles.footerText}>Account: {profile.org_name}</Text>
              {profile.upi_vpa && <Text style={styles.footerText}>UPI: {profile.upi_vpa}</Text>}
            </View>
            {qrCodeDataUrl && (
              <View style={styles.qrSection}>
                <Image src={qrCodeDataUrl} style={{ width: 80, height: 80 }} />
                <Text style={styles.footerText}>Scan to Pay</Text>
              </View>
            )}
          </View>
          <Text style={[styles.footerText, { textAlign: 'center', marginTop: 15 }]}>
            This is a computer-generated invoice and does not require a signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
