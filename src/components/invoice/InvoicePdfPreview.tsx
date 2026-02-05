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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontSize: '10px' }}>
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">
              {mockProfile.org_name}
            </h1>
            <p className="text-primary-foreground/80 mt-1 text-xs">
              {mockProfile.address}
            </p>
            <p className="text-primary-foreground/80 text-xs">
              GSTIN: {mockProfile.gstin}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-primary-foreground">TAX INVOICE</h2>
            <p className="text-primary-foreground/80 font-medium">{invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="px-6 py-4 border-b border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">
              Bill To
            </h3>
            {client ? (
              <div className="mt-2">
                <p className="font-semibold">{client.name}</p>
                <p className="text-muted-foreground">{client.billing_address}</p>
                {client.gstin && (
                  <p className="text-muted-foreground">GSTIN: {client.gstin}</p>
                )}
                <p className="text-muted-foreground">
                  State: {INDIAN_STATES[client.state_code]} ({client.state_code})
                </p>
              </div>
            ) : (
              <p className="mt-2 text-muted-foreground italic">Walk-in Customer</p>
            )}
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span className="font-medium">{dateIssued}</span>
              </div>
              {dateDue && (
                <div>
                  <span className="text-muted-foreground">Due: </span>
                  <span className="font-medium">{dateDue}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Place of Supply: </span>
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
            <tr className="border-b border-border">
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
                <td colSpan={isIntraState ? 7 : 6} className="py-8 text-center text-muted-foreground">
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
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right tabular-nums">{item.qty}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(item.rate)}</td>
                    {isIntraState ? (
                      <>
                        <td className="py-2 text-right tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-xs text-muted-foreground">{item.tax_rate / 2}%</span>
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatINR(taxAmount / 2)}
                          <br />
                          <span className="text-xs text-muted-foreground">{item.tax_rate / 2}%</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-2 text-right tabular-nums">
                        {formatINR(taxAmount)}
                        <br />
                        <span className="text-xs text-muted-foreground">{item.tax_rate}%</span>
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
      <div className="px-6 py-4 bg-muted/30">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{formatINR(calculations.subtotal)}</span>
            </div>
            {calculations.totalDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium tabular-nums text-success">
                  -{formatINR(calculations.totalDiscount)}
                </span>
              </div>
            )}
            {isIntraState ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST</span>
                  <span className="tabular-nums">{formatINR(calculations.gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST</span>
                  <span className="tabular-nums">{formatINR(calculations.gstBreakdown.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST</span>
                <span className="tabular-nums">{formatINR(calculations.gstBreakdown.igst)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold text-lg tabular-nums">{formatINR(calculations.grandTotal)}</span>
            </div>
          </div>
        </div>
        
        {calculations.grandTotal > 0 && (
          <p className="mt-3 text-xs text-muted-foreground italic">
            Amount in words: {numberToWords(calculations.grandTotal)}
          </p>
        )}
      </div>

      {/* Footer with QR */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex justify-between items-end">
          <div className="flex-1">
            {notes && (
              <div className="mb-3">
                <h4 className="font-semibold text-xs uppercase text-muted-foreground">Notes</h4>
                <p className="mt-1 text-sm whitespace-pre-wrap">{notes}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-xs uppercase text-muted-foreground">Bank Details</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Account Name: {mockProfile.org_name}
                <br />
                UPI: {mockProfile.upi_vpa}
              </p>
            </div>
          </div>
          
          {qrCodeUrl && (
            <div className="text-center">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-20 h-20" />
              <p className="text-xs text-muted-foreground mt-1">Scan to Pay</p>
            </div>
          )}
        </div>
      </div>

      {/* Legal Footer */}
      <div className="px-6 py-3 bg-muted/50 text-center text-xs text-muted-foreground">
        This is a computer-generated invoice and does not require a signature.
      </div>
    </div>
  );
}
