import { useMemo, useEffect, useState } from 'react';
import { formatINR, numberToWords } from '@/hooks/useInvoiceCalculations';
import { INDIAN_STATES } from '@/types';
import type { Client, Profile, InvoiceItemFormData, InvoiceCalculation } from '@/types';
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
}

const TEAL = '#03556E';
const TEAL_DARK = '#024558';
const TEAL_LIGHT = '#E8F4F8';
const TEAL_LIGHTER = '#F3FAFB';
const GRAY = '#6b7280';
const GRAY_LIGHT = '#9ca3af';
const BORDER = '#e5e7eb';

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
    case 'paid': return { bg: '#dcfce7', color: '#16a34a' };
    case 'finalized': return { bg: '#dbeafe', color: '#2563eb' };
    case 'cancelled': return { bg: '#fee2e2', color: '#dc2626' };
    default: return { bg: '#f3f4f6', color: GRAY };
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
}: InvoicePdfPreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const orgName = profile?.org_name || 'Your Business Name';
  const orgAddress = profile?.address || '123, Business Park, Mumbai, Maharashtra 400001';
  const orgGstin = profile?.gstin || '27XXXXX0000X1Z5';
  const orgPhone = profile?.phone || '';
  const orgEmail = profile?.email || '';
  const orgUpi = profile?.upi_vpa || '';
  const orgBankName = profile?.bank_account_name || '';
  const orgBankAccount = profile?.bank_account_number || '';
  const orgBankIfsc = profile?.bank_ifsc || '';

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

  return (
    <div className="bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden select-none" style={{ fontSize: '10px', colorScheme: 'light' }}>
      {/* ═══ HEADER ═══ */}
      <div className="px-6 pt-5 pb-4" style={{ backgroundColor: TEAL }}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {profile?.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="h-10 w-10 object-contain mb-2 rounded" />
            )}
            <h1 className="text-lg font-bold text-white leading-tight">{orgName}</h1>
            {orgAddress && <p className="text-white/75 text-[8.5px] mt-1 leading-snug">{orgAddress}</p>}
            {orgGstin && <p className="text-white/75 text-[8.5px]">GSTIN: {orgGstin}</p>}
            {orgPhone && <p className="text-white/75 text-[8.5px]">Phone: {orgPhone}</p>}
            {orgEmail && <p className="text-white/75 text-[8.5px]">Email: {orgEmail}</p>}
          </div>
          <div className="text-right flex flex-col items-end">
            <h2 className="text-xl font-bold text-white tracking-wider">TAX INVOICE</h2>
            <p className="text-white/80 text-[10.5px] font-medium mt-1">{invoiceNumber || '—'}</p>
            <span
              className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
            >
              {status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ DATE RIBBON ═══ */}
      <div className="flex items-center justify-end gap-5 px-6 py-1.5" style={{ backgroundColor: TEAL_DARK }}>
        <div className="flex items-center gap-1">
          <span className="text-white/50 text-[8px]">Issued:</span>
          <span className="text-white text-[8px] font-bold">{formatDate(dateIssued)}</span>
        </div>
        {dateDue && (
          <div className="flex items-center gap-1">
            <span className="text-white/50 text-[8px]">Due:</span>
            <span className="text-white text-[8px] font-bold">{formatDate(dateDue)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-white/50 text-[8px]">Supply:</span>
          <span className="text-white text-[8px] font-bold">
            {client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profileStateCode]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white/50 text-[8px]">Type:</span>
          <span className="text-white text-[8px] font-bold">{isIntraState ? 'Intra-State' : 'Inter-State'}</span>
        </div>
      </div>

      {/* ═══ BILL TO & FROM ═══ */}
      <div className="px-6 pt-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md" style={{ backgroundColor: TEAL_LIGHTER, border: `0.5px solid ${BORDER}` }}>
            <h4 className="text-[7.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEAL }}>Bill To</h4>
            {client ? (
              <>
                <p className="text-[10.5px] font-bold">{client.name}</p>
                {client.billing_address && <p className="text-[8.5px] leading-snug" style={{ color: GRAY }}>{client.billing_address}</p>}
                {client.gstin && <p className="text-[8.5px]" style={{ color: GRAY }}>GSTIN: {client.gstin}</p>}
                <p className="text-[8.5px]" style={{ color: GRAY }}>State: {INDIAN_STATES[client.state_code]} ({client.state_code})</p>
                {client.phone && <p className="text-[8.5px]" style={{ color: GRAY }}>Phone: {client.phone}</p>}
                {client.email && <p className="text-[8.5px]" style={{ color: GRAY }}>Email: {client.email}</p>}
              </>
            ) : (
              <p className="text-[8.5px] italic" style={{ color: GRAY }}>Walk-in Customer</p>
            )}
          </div>
          <div className="p-3 rounded-md" style={{ backgroundColor: TEAL_LIGHTER, border: `0.5px solid ${BORDER}` }}>
            <h4 className="text-[7.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEAL }}>From</h4>
            <p className="text-[10.5px] font-bold">{orgName}</p>
            {orgAddress && <p className="text-[8.5px] leading-snug" style={{ color: GRAY }}>{orgAddress}</p>}
            {orgGstin && <p className="text-[8.5px]" style={{ color: GRAY }}>GSTIN: {orgGstin}</p>}
            <p className="text-[8.5px]" style={{ color: GRAY }}>State: {INDIAN_STATES[profileStateCode]} ({profileStateCode})</p>
          </div>
        </div>
      </div>

      {/* ═══ ITEMS TABLE ═══ */}
      <div className="px-6 pb-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="rounded" style={{ backgroundColor: TEAL }}>
              <th className="text-left py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider rounded-l">#</th>
              <th className="text-left py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider">Description</th>
              <th className="text-right py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider">Qty</th>
              <th className="text-right py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider">Rate</th>
              <th className="text-right py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider">Disc.</th>
              {isIntraState ? (
                <>
                  <th className="text-right py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider">CGST</th>
                  <th className="text-right py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider">SGST</th>
                </>
              ) : (
                <th className="text-right py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider">IGST</th>
              )}
              <th className="text-right py-1.5 px-1.5 text-white text-[8px] font-bold uppercase tracking-wider rounded-r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {validItems.length === 0 ? (
              <tr>
                <td colSpan={isIntraState ? 8 : 7} className="py-6 text-center text-[9px]" style={{ color: GRAY_LIGHT }}>
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
                  <tr key={item.id} style={{ borderBottom: `0.5px solid ${BORDER}`, backgroundColor: isAlt ? TEAL_LIGHTER : 'transparent' }}>
                    <td className="py-1.5 px-1.5 text-[9px]">{index + 1}</td>
                    <td className="py-1.5 px-1.5">
                      <span className="text-[9px] font-bold">{item.description}</span>
                    </td>
                    <td className="py-1.5 px-1.5 text-right text-[9px] tabular-nums">{item.qty}</td>
                    <td className="py-1.5 px-1.5 text-right text-[9px] tabular-nums">{formatINR(item.rate)}</td>
                    <td className="py-1.5 px-1.5 text-right text-[9px] tabular-nums" style={{ color: discount > 0 ? '#16a34a' : GRAY_LIGHT }}>
                      {discount > 0 ? `-${formatINR(discount)}` : '—'}
                    </td>
                    {isIntraState ? (
                      <>
                        <td className="py-1.5 px-1.5 text-right text-[9px] tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-[7px]" style={{ color: GRAY_LIGHT }}>@{item.tax_rate / 2}%</span>
                        </td>
                        <td className="py-1.5 px-1.5 text-right text-[9px] tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-[7px]" style={{ color: GRAY_LIGHT }}>@{item.tax_rate / 2}%</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-1.5 px-1.5 text-right text-[9px] tabular-nums">
                        {formatINR(taxAmount)}
                        <br />
                        <span className="text-[7px]" style={{ color: GRAY_LIGHT }}>@{item.tax_rate}%</span>
                      </td>
                    )}
                    <td className="py-1.5 px-1.5 text-right text-[9px] font-bold tabular-nums">
                      {formatINR(itemCalc?.totalAmount || 0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Items summary */}
        {validItems.length > 0 && (
          <div className="mt-1 px-1.5 py-1 rounded" style={{ backgroundColor: TEAL_LIGHT }}>
            <span className="text-[8px] font-bold" style={{ color: TEAL }}>
              {validItems.length} item{validItems.length !== 1 ? 's' : ''} | {totalQty} unit{totalQty !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ═══ SUMMARY (Amount in Words + Totals) ═══ */}
      <div className="px-6 pb-3">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            {calculations.grandTotal > 0 && (
              <div>
                <h4 className="text-[7.5px] font-bold uppercase tracking-widest mb-1" style={{ color: TEAL }}>Amount in Words</h4>
                <p className="text-[9.5px] italic leading-relaxed">{numberToWords(calculations.grandTotal)}</p>
              </div>
            )}
          </div>
          <div className="w-52 p-3 rounded-md" style={{ backgroundColor: TEAL_LIGHT, border: `0.5px solid ${BORDER}` }}>
            <div className="flex justify-between py-0.5">
              <span className="text-[9px]" style={{ color: GRAY }}>Subtotal</span>
              <span className="text-[9px] font-bold tabular-nums">{formatINR(calculations.subtotal)}</span>
            </div>
            {calculations.totalDiscount > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-[9px]" style={{ color: GRAY }}>Discount</span>
                <span className="text-[9px] font-bold tabular-nums" style={{ color: '#16a34a' }}>-{formatINR(calculations.totalDiscount)}</span>
              </div>
            )}
            {isIntraState ? (
              <>
                <div className="flex justify-between py-0.5">
                  <span className="text-[9px]" style={{ color: GRAY }}>CGST</span>
                  <span className="text-[9px] font-bold tabular-nums">{formatINR(calculations.gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[9px]" style={{ color: GRAY }}>SGST</span>
                  <span className="text-[9px] font-bold tabular-nums">{formatINR(calculations.gstBreakdown.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-0.5">
                <span className="text-[9px]" style={{ color: GRAY }}>IGST</span>
                <span className="text-[9px] font-bold tabular-nums">{formatINR(calculations.gstBreakdown.igst)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-1.5" style={{ borderTop: `2px solid ${TEAL}` }}>
              <span className="text-[12px] font-bold" style={{ color: TEAL_DARK }}>Grand Total</span>
              <span className="text-[14px] font-bold tabular-nums" style={{ color: TEAL }}>
                {formatINR(calculations.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ NOTES ═══ */}
      {notes && (
        <div className="px-6 pb-3">
          <h4 className="text-[7.5px] font-bold uppercase tracking-widest mb-1" style={{ color: TEAL }}>Notes & Terms</h4>
          <p className="text-[9px] whitespace-pre-wrap leading-relaxed" style={{ color: GRAY }}>{notes}</p>
        </div>
      )}

      {/* ═══ PAYMENT FOOTER ═══ */}
      <div className="px-6 py-3 flex justify-between items-end" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="flex-1">
          <h4 className="text-[7.5px] font-bold uppercase tracking-widest mb-1" style={{ color: TEAL }}>Payment Information</h4>
          <div className="flex gap-5 mt-1">
            {orgBankName && (
              <div>
                <p className="text-[8px]" style={{ color: GRAY_LIGHT }}>Account Name</p>
                <p className="text-[9px]">{orgBankName}</p>
              </div>
            )}
            {orgBankAccount && (
              <div>
                <p className="text-[8px]" style={{ color: GRAY_LIGHT }}>Account No.</p>
                <p className="text-[9px]">{orgBankAccount}</p>
              </div>
            )}
            {orgBankIfsc && (
              <div>
                <p className="text-[8px]" style={{ color: GRAY_LIGHT }}>IFSC</p>
                <p className="text-[9px]">{orgBankIfsc}</p>
              </div>
            )}
            {orgUpi && (
              <div>
                <p className="text-[8px]" style={{ color: GRAY_LIGHT }}>UPI ID</p>
                <p className="text-[9px]">{orgUpi}</p>
              </div>
            )}
            {orgEmail && !orgBankName && (
              <div>
                <p className="text-[8px]" style={{ color: GRAY_LIGHT }}>Email</p>
                <p className="text-[9px]">{orgEmail}</p>
              </div>
            )}
          </div>
        </div>
        {qrCodeUrl && (
          <div className="text-center ml-4">
            <p className="text-[7px] font-bold uppercase tracking-wider mb-0.5" style={{ color: TEAL }}>Scan to Pay</p>
            <img src={qrCodeUrl} alt="UPI QR Code" className="w-16 h-16" />
            <p className="text-[7.5px] mt-0.5" style={{ color: GRAY }}>UPI Payment</p>
          </div>
        )}
      </div>

      {/* ═══ THANK YOU ═══ */}
      <div className="py-2.5 text-center" style={{ backgroundColor: TEAL_LIGHT }}>
        <p className="text-[10px] font-bold" style={{ color: TEAL }}>Thank you for your business!</p>
      </div>

      {/* ═══ LEGAL FOOTER ═══ */}
      <div className="py-2 text-center">
        <p className="text-[7px]" style={{ color: GRAY_LIGHT }}>
          This is a computer-generated invoice and does not require a physical signature.
        </p>
      </div>
    </div>
  );
}
