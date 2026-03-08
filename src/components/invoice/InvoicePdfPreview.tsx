import { useMemo, useEffect, useState } from 'react';
import { formatINR, numberToWords } from '@/hooks/useInvoiceCalculations';
import { INDIAN_STATES } from '@/types';
import type { Client, Profile, InvoiceItemFormData, InvoiceCalculation } from '@/types';
import type { InvoiceTemplate } from './invoiceTemplates';
import { TEMPLATE_PALETTES } from './invoiceTemplates';
import QRCode from 'qrcode';

interface InvoicePdfPreviewProps {
  invoiceNumber: string;
  dateIssued: string;
  dateDue: string;
  client: Client | null;
  items: InvoiceItemFormData[];
  calculations: InvoiceCalculation;
  profileStateCode: string;
  notes: string;
  profile?: Profile | null;
  status?: string;
  showPaymentInfo?: boolean;
  template?: InvoiceTemplate;
}

const GRAY_900 = '#111827';
const GRAY_700 = '#374151';
const GRAY_500 = '#6b7280';
const GRAY_400 = '#9ca3af';
const GRAY_200 = '#e5e7eb';
const GRAY_100 = '#f3f4f6';
const GREEN = '#059669';

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
    case 'paid': return { bg: '#dcfce7', color: '#059669' };
    case 'finalized': return { bg: '#dbeafe', color: '#2563eb' };
    case 'cancelled': return { bg: '#fee2e2', color: '#dc2626' };
    default: return { bg: GRAY_100, color: GRAY_500 };
  }
}

export function InvoicePdfPreview({
  invoiceNumber,
  dateIssued,
  dateDue,
  client,
  items,
  calculations,
  profileStateCode,
  notes,
  profile,
  status = 'draft',
  showPaymentInfo = true,
  template = 'modern',
}: InvoicePdfPreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const p = TEMPLATE_PALETTES[template];

  const orgName = profile?.org_name || 'Your Business Name';
  const orgAddress = profile?.address || '123, Business Park, Mumbai, Maharashtra 400001';
  const orgGstin = profile?.gstin || '27XXXXX0000X1Z5';
  const orgPhone = profile?.phone || '';
  const orgEmail = profile?.email || '';
  const orgUpi = profile?.upi_vpa || '';
  const orgBankName = profile?.bank_account_name || '';
  const orgBankAccount = profile?.bank_account_number || '';
  const orgBankIfsc = profile?.bank_ifsc || '';
  const orgPan = profile?.pan_number || '';

  useEffect(() => {
    const generateQR = async () => {
      if (calculations.grandTotal > 0 && orgUpi) {
        const upiString = `upi://pay?pa=${orgUpi}&pn=${encodeURIComponent(orgName)}&am=${calculations.grandTotal}&tr=${invoiceNumber}&tn=Invoice%20payment`;
        try {
          const url = await QRCode.toDataURL(upiString, { width: 100, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('QR generation error:', err);
        }
      }
    };
    generateQR();
  }, [calculations.grandTotal, invoiceNumber, orgUpi, orgName]);

  const validItems = items.filter((item) => item.description && item.rate > 0);
  const isIntraState = calculations.gstBreakdown.type === 'intra-state';
  const totalQty = validItems.reduce((sum, i) => sum + i.qty, 0);
  const statusStyle = getStatusStyle(status);

  const fontFamily = p.fontStyle === 'serif' ? "'Georgia', 'Times New Roman', serif" : p.fontStyle === 'clean' ? "'Inter', 'Helvetica', sans-serif" : "'Plus Jakarta Sans', sans-serif";

  return (
    <div className="bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden select-none w-full min-w-0" style={{ fontSize: '10px', colorScheme: 'light', fontFamily }}>
      {/* ═══ ACCENT BAR ═══ */}
      {p.showAccentBar && <div className="h-1" style={{ backgroundColor: p.accent }} />}
      {!p.showAccentBar && template === 'classic' && (
        <div className="h-0.5" style={{ backgroundColor: p.accent }} />
      )}

      {/* ═══ HEADER ═══ */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            {profile?.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="h-8 w-8 object-contain mb-1.5" style={{ borderRadius: p.borderRadius }} />
            )}
            <h1 className="text-sm font-bold leading-tight truncate" style={{ color: GRAY_900 }}>{orgName}</h1>
            {orgAddress && <p className="text-[7px] mt-0.5 leading-snug break-words" style={{ color: GRAY_500 }}>{orgAddress}</p>}
            {orgGstin && <p className="text-[7px]" style={{ color: GRAY_500 }}>GSTIN: {orgGstin}</p>}
            {orgPan && <p className="text-[7px]" style={{ color: GRAY_500 }}>PAN: {orgPan}</p>}
            {orgPhone && <p className="text-[7px]" style={{ color: GRAY_500 }}>Phone: {orgPhone}</p>}
            {orgEmail && <p className="text-[7px]" style={{ color: GRAY_500 }}>Email: {orgEmail}</p>}
          </div>
          <div className="text-right flex flex-col items-end shrink-0">
            {template === 'minimal' ? (
              <>
                <h2 className="text-base font-light uppercase tracking-[3px] whitespace-nowrap" style={{ color: GRAY_900 }}>Invoice</h2>
                <p className="text-[9px] font-medium mt-1" style={{ color: GRAY_500 }}>{invoiceNumber || '—'}</p>
              </>
            ) : template === 'classic' ? (
              <>
                <h2 className="text-base font-bold uppercase tracking-[1.5px] whitespace-nowrap" style={{ color: p.accent }}>Tax Invoice</h2>
                <div className="mt-1 px-1.5 py-0.5" style={{ borderBottom: `2px solid ${p.accent}` }}>
                  <p className="text-[9px] font-semibold" style={{ color: p.accent }}>{invoiceNumber || '—'}</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-[6px] uppercase tracking-[1.5px] mb-0.5" style={{ color: GRAY_400 }}>Invoice</p>
                <h2 className="text-base font-bold tracking-wide whitespace-nowrap" style={{ color: p.accent }}>TAX INVOICE</h2>
                <p className="text-[9px] font-semibold mt-0.5" style={{ color: GRAY_500 }}>{invoiceNumber || '—'}</p>
              </>
            )}
            <span
              className="mt-1.5 inline-block px-2 py-0.5 text-[6.5px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, borderRadius: template === 'modern' ? '9999px' : template === 'classic' ? '0' : '2px' }}
            >
              {status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ META STRIP ═══ */}
      {template === 'minimal' ? (
        <div className="mx-4 mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5 py-2" style={{ borderTop: `1px solid ${GRAY_200}`, borderBottom: `1px solid ${GRAY_200}` }}>
          {[
            { label: 'Date Issued', value: formatDate(dateIssued) },
            { label: 'Due Date', value: dateDue ? formatDate(dateDue) : '—' },
            { label: 'Place of Supply', value: client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profileStateCode] },
            { label: 'Supply Type', value: isIntraState ? 'Intra-State' : 'Inter-State' },
          ].map(m => (
            <div key={m.label}>
              <p className="text-[5.5px] uppercase tracking-wider mb-0.5" style={{ color: GRAY_400 }}>{m.label}</p>
              <p className="text-[7.5px] font-medium" style={{ color: GRAY_900 }}>{m.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-y-1" style={{ backgroundColor: template === 'classic' ? p.accentLight : GRAY_100, borderTop: `0.5px solid ${GRAY_200}`, borderBottom: `0.5px solid ${GRAY_200}`, padding: '6px 16px' }}>
          {[
            { label: 'Date Issued', value: formatDate(dateIssued) },
            { label: 'Due Date', value: dateDue ? formatDate(dateDue) : '—' },
            { label: 'Place of Supply', value: client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profileStateCode] },
            { label: 'Supply Type', value: isIntraState ? 'Intra-State' : 'Inter-State' },
          ].map(m => (
            <div key={m.label} className="py-0.5">
              <p className="text-[5.5px] uppercase tracking-wider mb-0.5" style={{ color: GRAY_400 }}>{m.label}</p>
              <p className="text-[7.5px] font-bold" style={{ color: GRAY_900 }}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ═══ BILL TO & FROM ═══ */}
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 min-w-0" style={{
            border: `1px solid ${GRAY_200}`,
            borderLeft: template !== 'minimal' ? `3px solid ${p.accent}` : `1px solid ${GRAY_200}`,
            borderRadius: p.borderRadius,
          }}>
            <h4 className="text-[6px] font-bold uppercase tracking-[1.5px] mb-1.5" style={{ color: p.accent }}>Bill To</h4>
            {client ? (
              <>
                <p className="text-[9px] font-bold truncate" style={{ color: GRAY_900 }}>{client.name}</p>
                {client.billing_address && <p className="text-[7px] leading-snug mt-0.5 break-words" style={{ color: GRAY_500 }}>{client.billing_address}</p>}
                {client.gstin && <p className="text-[7px]" style={{ color: GRAY_500 }}>GSTIN: {client.gstin}</p>}
                <p className="text-[7px]" style={{ color: GRAY_500 }}>State: {INDIAN_STATES[client.state_code]} ({client.state_code})</p>
                {client.phone && <p className="text-[7px]" style={{ color: GRAY_500 }}>Phone: {client.phone}</p>}
                {client.email && <p className="text-[7px]" style={{ color: GRAY_500 }}>Email: {client.email}</p>}
              </>
            ) : (
              <p className="text-[7px] italic" style={{ color: GRAY_400 }}>Walk-in Customer</p>
            )}
          </div>
          <div className="p-2 min-w-0" style={{ border: `1px solid ${GRAY_200}`, borderRadius: p.borderRadius }}>
            <h4 className="text-[6px] font-bold uppercase tracking-[1.5px] mb-1.5" style={{ color: p.accent }}>From</h4>
            <p className="text-[9px] font-bold truncate" style={{ color: GRAY_900 }}>{orgName}</p>
            {orgAddress && <p className="text-[7px] leading-snug mt-0.5 break-words" style={{ color: GRAY_500 }}>{orgAddress}</p>}
            {orgGstin && <p className="text-[7px]" style={{ color: GRAY_500 }}>GSTIN: {orgGstin}</p>}
            <p className="text-[7px]" style={{ color: GRAY_500 }}>State: {INDIAN_STATES[profileStateCode]} ({profileStateCode})</p>
          </div>
        </div>
      </div>

      {/* ═══ ITEMS TABLE ═══ */}
      <div className="px-4 pb-2 overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '280px' }}>
          <thead>
            <tr style={{
              backgroundColor: p.tableStyle === 'minimal' ? 'transparent' : p.tableHeaderBg,
              borderBottom: p.tableStyle === 'minimal' ? `1.5px solid ${GRAY_900}` : 'none',
            }}>
              {['#', 'Description', 'Qty', 'Rate', 'Disc.'].map((h, i) => (
                <th key={h} className={`${i <= 1 ? 'text-left' : 'text-right'} py-2 px-1.5 text-[7.5px] font-bold uppercase tracking-wider`}
                  style={{
                    color: p.tableStyle === 'minimal' ? GRAY_900 : p.tableHeaderText,
                    borderRadius: i === 0 && p.tableStyle === 'filled' ? `${p.borderRadius} 0 0 ${p.borderRadius}` : undefined,
                  }}>
                  {h}
                </th>
              ))}
              {isIntraState ? (
                <>
                  <th className="text-right py-2 px-1.5 text-[7.5px] font-bold uppercase tracking-wider" style={{ color: p.tableStyle === 'minimal' ? GRAY_900 : p.tableHeaderText }}>CGST</th>
                  <th className="text-right py-2 px-1.5 text-[7.5px] font-bold uppercase tracking-wider" style={{ color: p.tableStyle === 'minimal' ? GRAY_900 : p.tableHeaderText }}>SGST</th>
                </>
              ) : (
                <th className="text-right py-2 px-1.5 text-[7.5px] font-bold uppercase tracking-wider" style={{ color: p.tableStyle === 'minimal' ? GRAY_900 : p.tableHeaderText }}>IGST</th>
              )}
              <th className="text-right py-2 px-1.5 text-[7.5px] font-bold uppercase tracking-wider" style={{ color: p.tableStyle === 'minimal' ? GRAY_900 : p.tableHeaderText }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {validItems.length === 0 ? (
              <tr>
                <td colSpan={isIntraState ? 8 : 7} className="py-6 text-center text-[9px]" style={{ color: GRAY_400 }}>
                  No items added
                </td>
              </tr>
            ) : (
              validItems.map((item, index) => {
                const itemCalc = calculations.itemCalculations.find((c) => c.itemId === item.id);
                const taxAmount = itemCalc?.taxAmount || 0;
                const discount = item.discount || 0;
                const isAlt = index % 2 === 1;

                return (
                  <tr key={item.id} style={{
                    borderBottom: `0.5px solid ${GRAY_200}`,
                    backgroundColor: p.tableStyle === 'filled' && isAlt ? p.tableAltBg : 'transparent',
                  }}>
                    <td className="py-2 px-1.5 text-[8.5px]" style={{ color: GRAY_400 }}>{index + 1}</td>
                    <td className="py-2 px-1.5">
                      <span className="text-[8.5px] font-semibold" style={{ color: GRAY_900 }}>{item.description}</span>
                    </td>
                    <td className="py-2 px-1.5 text-right text-[8.5px] tabular-nums font-semibold">{item.qty}</td>
                    <td className="py-2 px-1.5 text-right text-[8.5px] tabular-nums">{formatINR(item.rate)}</td>
                    <td className="py-2 px-1.5 text-right text-[8.5px] tabular-nums" style={{ color: discount > 0 ? GREEN : GRAY_400 }}>
                      {discount > 0 ? `-${formatINR(discount)}` : '—'}
                    </td>
                    {isIntraState ? (
                      <>
                        <td className="py-2 px-1.5 text-right text-[8.5px] tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-[6.5px]" style={{ color: GRAY_400 }}>@{item.tax_rate / 2}%</span>
                        </td>
                        <td className="py-2 px-1.5 text-right text-[8.5px] tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-[6.5px]" style={{ color: GRAY_400 }}>@{item.tax_rate / 2}%</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-2 px-1.5 text-right text-[8.5px] tabular-nums">
                        {formatINR(taxAmount)}
                        <br />
                        <span className="text-[6.5px]" style={{ color: GRAY_400 }}>@{item.tax_rate}%</span>
                      </td>
                    )}
                    <td className="py-2 px-1.5 text-right text-[8.5px] font-bold tabular-nums">
                      {formatINR(itemCalc?.totalAmount || 0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Items summary */}
        {validItems.length > 0 && template !== 'minimal' && (
          <div className="mt-1 px-2 py-1.5 flex justify-between items-center" style={{ backgroundColor: p.accentLight, borderRadius: p.borderRadius }}>
            <span className="text-[7.5px] font-semibold" style={{ color: p.accent }}>
              {validItems.length} item{validItems.length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''}
            </span>
            <span className="text-[7.5px]" style={{ color: GRAY_500 }}>
              Taxable: {formatINR(calculations.subtotal - calculations.totalDiscount)}
            </span>
          </div>
        )}
      </div>

      {/* ═══ SUMMARY ═══ */}
      <div className="px-6 pb-3">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            {calculations.grandTotal > 0 && (
              <div>
                <h4 className="text-[7px] font-bold uppercase tracking-[1.2px] mb-1" style={{ color: p.accent }}>Amount in Words</h4>
                <p className="text-[9.5px] italic leading-relaxed" style={{ color: GRAY_700 }}>{numberToWords(calculations.grandTotal)}</p>
              </div>
            )}
          </div>
          <div className="w-52 p-3" style={{ border: `1px solid ${GRAY_200}`, borderRadius: p.borderRadius }}>
            <div className="flex justify-between py-0.5">
              <span className="text-[8.5px]" style={{ color: GRAY_500 }}>Subtotal</span>
              <span className="text-[8.5px] font-semibold tabular-nums">{formatINR(calculations.subtotal)}</span>
            </div>
            {calculations.totalDiscount > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-[8.5px]" style={{ color: GRAY_500 }}>Discount</span>
                <span className="text-[8.5px] font-semibold tabular-nums" style={{ color: GREEN }}>-{formatINR(calculations.totalDiscount)}</span>
              </div>
            )}
            {isIntraState ? (
              <>
                <div className="flex justify-between py-0.5">
                  <span className="text-[8.5px]" style={{ color: GRAY_500 }}>CGST</span>
                  <span className="text-[8.5px] font-semibold tabular-nums">{formatINR(calculations.gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[8.5px]" style={{ color: GRAY_500 }}>SGST</span>
                  <span className="text-[8.5px] font-semibold tabular-nums">{formatINR(calculations.gstBreakdown.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-0.5">
                <span className="text-[8.5px]" style={{ color: GRAY_500 }}>IGST</span>
                <span className="text-[8.5px] font-semibold tabular-nums">{formatINR(calculations.gstBreakdown.igst)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2" style={{ borderTop: `2px solid ${p.accent}` }}>
              <span className="text-[11px] font-bold" style={{ color: GRAY_900 }}>Grand Total</span>
              <span className="text-[14px] font-bold tabular-nums" style={{ color: p.accent }}>
                {formatINR(calculations.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ NOTES ═══ */}
      {notes && (
        <div className="px-6 pb-3">
          <h4 className="text-[7px] font-bold uppercase tracking-[1.2px] mb-1" style={{ color: p.accent }}>Notes & Terms</h4>
          <p className="text-[8.5px] whitespace-pre-wrap leading-relaxed" style={{ color: GRAY_500 }}>{notes}</p>
        </div>
      )}

      {/* ═══ AUTHORIZED SIGNATORY ═══ */}
      <div className="px-6 pb-3 flex justify-end">
        <div className="w-40 text-center">
          <div className="mt-8 mb-1.5" style={{ borderBottom: `1px solid ${GRAY_700}` }} />
          <p className="text-[7px]" style={{ color: GRAY_500 }}>Authorized Signatory</p>
          <p className="text-[7.5px] font-semibold mt-0.5" style={{ color: GRAY_700 }}>{orgName}</p>
        </div>
      </div>

      {/* ═══ PAYMENT FOOTER ═══ */}
      {showPaymentInfo && (
        <div className="px-6 py-3 flex justify-between items-start" style={{ backgroundColor: GRAY_100, borderTop: `1px solid ${GRAY_200}` }}>
          <div className="flex-1">
            <h4 className="text-[7px] font-bold uppercase tracking-[1.2px] mb-1.5" style={{ color: p.accent }}>Payment Information</h4>
            <div className="flex gap-5 mt-1 flex-wrap">
              {orgBankName && (
                <div>
                  <p className="text-[7px]" style={{ color: GRAY_400 }}>Account Name</p>
                  <p className="text-[8.5px] font-semibold" style={{ color: GRAY_700 }}>{orgBankName}</p>
                </div>
              )}
              {orgBankAccount && (
                <div>
                  <p className="text-[7px]" style={{ color: GRAY_400 }}>Account No.</p>
                  <p className="text-[8.5px] font-semibold" style={{ color: GRAY_700 }}>{orgBankAccount}</p>
                </div>
              )}
              {orgBankIfsc && (
                <div>
                  <p className="text-[7px]" style={{ color: GRAY_400 }}>IFSC</p>
                  <p className="text-[8.5px] font-semibold" style={{ color: GRAY_700 }}>{orgBankIfsc}</p>
                </div>
              )}
              {orgUpi && (
                <div>
                  <p className="text-[7px]" style={{ color: GRAY_400 }}>UPI ID</p>
                  <p className="text-[8.5px] font-semibold" style={{ color: GRAY_700 }}>{orgUpi}</p>
                </div>
              )}
            </div>
          </div>
          {qrCodeUrl && (
            <div className="text-center ml-4">
              <p className="text-[7px] font-bold uppercase tracking-wider mb-0.5" style={{ color: p.accent }}>Scan to Pay</p>
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-16 h-16" />
              <p className="text-[6.5px] mt-0.5" style={{ color: GRAY_400 }}>UPI Payment</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ THANK YOU ═══ */}
      {p.showThankYou && (
        <div className="py-3 text-center" style={{ backgroundColor: p.accent }}>
          <p className="text-[10px] font-semibold text-white tracking-wide">Thank you for your business!</p>
          <p className="text-[7px] text-white/70 mt-0.5">Questions? Contact {orgEmail || orgPhone || orgName}</p>
        </div>
      )}

      {/* ═══ LEGAL FOOTER ═══ */}
      <div className="py-2 text-center" style={{ borderTop: !p.showThankYou ? `1px solid ${GRAY_200}` : 'none' }}>
        <p className="text-[6.5px]" style={{ color: GRAY_400 }}>
          This is a computer-generated invoice and does not require a physical signature.
        </p>
      </div>
    </div>
  );
}
