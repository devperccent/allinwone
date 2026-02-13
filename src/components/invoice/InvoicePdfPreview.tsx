import { useMemo, useEffect, useState } from 'react';
import { formatINR, numberToWords } from '@/hooks/useInvoiceCalculations';
import { INDIAN_STATES } from '@/types';
import type { Client, InvoiceItemFormData, InvoiceCalculation } from '@/types';
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
}

// Mock profile data
const mockProfile = {
  org_name: 'Your Business Name',
  email: 'contact@yourbusiness.com',
  phone: '9876543210',
  address: '123, Business Park, Mumbai, Maharashtra 400001',
  gstin: '27XXXXX0000X1Z5',
  upi_vpa: 'yourbusiness@upi',
};

export function InvoicePdfPreview({
  invoiceNumber,
  dateIssued,
  dateDue,
  client,
  items,
  calculations,
  profileStateCode,
  notes,
}: InvoicePdfPreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate UPI QR Code
  useEffect(() => {
    const generateQR = async () => {
      if (calculations.grandTotal > 0 && mockProfile.upi_vpa) {
        const upiString = `upi://pay?pa=${mockProfile.upi_vpa}&pn=${encodeURIComponent(
          mockProfile.org_name
        )}&am=${calculations.grandTotal}&tr=${invoiceNumber}&tn=Invoice%20payment`;
        
        try {
          const url = await QRCode.toDataURL(upiString, {
            width: 100,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('QR generation error:', err);
        }
      }
    };
    generateQR();
  }, [calculations.grandTotal, invoiceNumber]);

  const validItems = items.filter((item) => item.description && item.rate > 0);
  const isIntraState = calculations.gstBreakdown.type === 'intra-state';

  return (
    <div className="bg-white text-[#1a1a2e] rounded-lg shadow-lg overflow-hidden" style={{ fontSize: '10px', colorScheme: 'light' }}>
      {/* Header */}
      <div className="px-6 py-4" style={{ backgroundColor: '#03556E' }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-white">
              {mockProfile.org_name}
            </h1>
            <p className="text-white/80 mt-1 text-xs">
              {mockProfile.address}
            </p>
            <p className="text-white/80 text-xs">
              GSTIN: {mockProfile.gstin}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-white">TAX INVOICE</h2>
            <p className="text-white/80 font-medium">{invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold uppercase tracking-wide text-xs" style={{ color: '#6b7280' }}>
              Bill To
            </h3>
            {client ? (
              <div className="mt-2">
                <p className="font-semibold">{client.name}</p>
                <p style={{ color: '#6b7280' }}>{client.billing_address}</p>
                {client.gstin && (
                  <p style={{ color: '#6b7280' }}>GSTIN: {client.gstin}</p>
                )}
                <p style={{ color: '#6b7280' }}>
                  State: {INDIAN_STATES[client.state_code]} ({client.state_code})
                </p>
              </div>
            ) : (
              <p className="mt-2 italic" style={{ color: '#6b7280' }}>Walk-in Customer</p>
            )}
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div>
                <span style={{ color: '#6b7280' }}>Date: </span>
                <span className="font-medium">{dateIssued}</span>
              </div>
              {dateDue && (
                <div>
                  <span style={{ color: '#6b7280' }}>Due: </span>
                  <span className="font-medium">{dateDue}</span>
                </div>
              )}
              <div>
                <span style={{ color: '#6b7280' }}>Place of Supply: </span>
                <span className="font-medium">
                  {client ? INDIAN_STATES[client.state_code] : INDIAN_STATES[profileStateCode]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-6 py-4">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th className="text-left py-2 font-semibold">#</th>
              <th className="text-left py-2 font-semibold">Description</th>
              <th className="text-right py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Rate</th>
              {isIntraState ? (
                <>
                  <th className="text-right py-2 font-semibold">CGST</th>
                  <th className="text-right py-2 font-semibold">SGST</th>
                </>
              ) : (
                <th className="text-right py-2 font-semibold">IGST</th>
              )}
              <th className="text-right py-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {validItems.length === 0 ? (
              <tr>
                <td colSpan={isIntraState ? 7 : 6} className="py-8 text-center" style={{ color: '#6b7280' }}>
                  No items added
                </td>
              </tr>
            ) : (
              validItems.map((item, index) => {
                const itemCalc = calculations.itemCalculations.find(
                  (c) => c.itemId === item.id
                );
                const taxAmount = itemCalc?.taxAmount || 0;
                
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb80' }}>
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right tabular-nums">{item.qty}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(item.rate)}</td>
                    {isIntraState ? (
                      <>
                        <td className="py-2 text-right tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-xs" style={{ color: '#6b7280' }}>{item.tax_rate / 2}%</span>
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-xs" style={{ color: '#6b7280' }}>{item.tax_rate / 2}%</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-2 text-right tabular-nums">
                        {formatINR(taxAmount)}
                        <br />
                        <span className="text-xs" style={{ color: '#6b7280' }}>{item.tax_rate}%</span>
                      </td>
                    )}
                    <td className="py-2 text-right font-medium tabular-nums">
                      {formatINR(itemCalc?.totalAmount || 0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 py-4" style={{ backgroundColor: '#E8F4F8' }}>
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span className="font-medium tabular-nums">{formatINR(calculations.subtotal)}</span>
            </div>
            {calculations.totalDiscount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: '#6b7280' }}>Discount</span>
                <span className="font-medium tabular-nums" style={{ color: '#16a34a' }}>
                  -{formatINR(calculations.totalDiscount)}
                </span>
              </div>
            )}
            {isIntraState ? (
              <>
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>CGST</span>
                  <span className="tabular-nums">{formatINR(calculations.gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>SGST</span>
                  <span className="tabular-nums">{formatINR(calculations.gstBreakdown.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span style={{ color: '#6b7280' }}>IGST</span>
                <span className="tabular-nums">{formatINR(calculations.gstBreakdown.igst)}</span>
              </div>
            )}
            <div className="pt-2 flex justify-between" style={{ borderTop: '2px solid #03556E' }}>
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold text-lg tabular-nums" style={{ color: '#03556E' }}>{formatINR(calculations.grandTotal)}</span>
            </div>
          </div>
        </div>
        
        {calculations.grandTotal > 0 && (
          <p className="mt-3 text-xs italic" style={{ color: '#6b7280' }}>
            Amount in words: {numberToWords(calculations.grandTotal)}
          </p>
        )}
      </div>

      {/* Footer with QR */}
      <div className="px-6 py-4" style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="flex justify-between items-end">
          <div className="flex-1">
            {notes && (
              <div className="mb-3">
                <h4 className="font-semibold text-xs uppercase" style={{ color: '#6b7280' }}>Notes</h4>
                <p className="mt-1 text-sm whitespace-pre-wrap">{notes}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-xs uppercase" style={{ color: '#6b7280' }}>Bank Details</h4>
              <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
                Account Name: {mockProfile.org_name}
                <br />
                UPI: {mockProfile.upi_vpa}
              </p>
            </div>
          </div>
          
          {qrCodeUrl && (
            <div className="text-center">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-20 h-20" />
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Scan to Pay</p>
            </div>
          )}
        </div>
      </div>

      {/* Legal Footer */}
      <div className="px-6 py-3 text-center text-xs" style={{ backgroundColor: '#E8F4F8', color: '#6b7280' }}>
        This is a computer-generated invoice and does not require a signature.
      </div>
    </div>
  );
}
