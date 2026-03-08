import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { INDIAN_STATES } from '@/types';
import type { Invoice, InvoiceItem, Client } from '@/types';
import { Loader2, FileText, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicInvoicePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invoice link.');
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        const { data: inv, error: invError } = await supabase
          .from('invoices')
          .select('*, client:clients(*), items:invoice_items(*)')
          .eq('share_token', token)
          .single();

        if (invError || !inv) {
          setError('Invoice not found or link has expired.');
          return;
        }

        setInvoice(inv as unknown as Invoice);
        setItems((inv.items || []) as unknown as InvoiceItem[]);
        setClient((inv.client || null) as unknown as Client);
      } catch {
        setError('Something went wrong loading the invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#03556E]" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invoice Not Found</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const isIntraState = !client || (client.state_code === (invoice.client?.state_code || '27')); // Compare against invoice profile's state

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
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-[#03556E] shrink-0" />
            <span className="font-semibold text-gray-700 truncate">Invoice {invoice.invoice_number}</span>
          </div>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-2 shrink-0"
            style={{ backgroundColor: '#03556E' }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Print / Save PDF</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none" style={{ fontSize: '14px' }}>
          {/* Header */}
          <div className="px-4 sm:px-8 py-4 sm:py-6" style={{ backgroundColor: '#03556E' }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">TAX INVOICE</h1>
                <p className="text-white/80 mt-1 text-sm">{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase"
                  style={{
                    backgroundColor: invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'finalized' ? '#dbeafe' : '#f3f4f6',
                    color: invoice.status === 'paid' ? '#16a34a' : invoice.status === 'finalized' ? '#2563eb' : '#6b7280',
                  }}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-b" style={{ borderColor: '#e5e7eb' }}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#03556E' }}>Bill To</h3>
              {client ? (
                <>
                  <p className="font-bold text-gray-800">{client.name}</p>
                  {client.billing_address && <p className="text-gray-500 text-sm">{client.billing_address}</p>}
                  {client.gstin && <p className="text-gray-500 text-sm">GSTIN: {client.gstin}</p>}
                  <p className="text-gray-500 text-sm">State: {INDIAN_STATES[client.state_code]}</p>
                </>
              ) : (
                <p className="text-gray-400 italic">Walk-in Customer</p>
              )}
            </div>
            <div className="sm:text-right space-y-1">
              <div>
                <span className="text-gray-400 text-sm">Date: </span>
                <span className="font-medium">{invoice.date_issued}</span>
              </div>
              {invoice.date_due && (
                <div>
                  <span className="text-gray-400 text-sm">Due: </span>
                  <span className="font-medium">{invoice.date_due}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items - Card layout on mobile, table on desktop */}
          <div className="px-4 sm:px-8 py-4">
            {/* Desktop table */}
            <table className="w-full text-sm hidden sm:table">
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th className="text-left py-2 font-bold">#</th>
                  <th className="text-left py-2 font-bold">Description</th>
                  <th className="text-right py-2 font-bold">Qty</th>
                  <th className="text-right py-2 font-bold">Rate</th>
                  <th className="text-right py-2 font-bold">Tax</th>
                  <th className="text-right py-2 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const base = Number(item.qty) * Number(item.rate);
                  const tax = (base - Number(item.discount)) * (Number(item.tax_rate) / 100);
                  const total = base - Number(item.discount) + tax;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td className="py-2">{idx + 1}</td>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.qty}</td>
                      <td className="py-2 text-right">{formatINR(Number(item.rate))}</td>
                      <td className="py-2 text-right">{item.tax_rate}%</td>
                      <td className="py-2 text-right font-semibold">{formatINR(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile card layout */}
            <div className="sm:hidden space-y-3">
              {items.map((item, idx) => {
                const base = Number(item.qty) * Number(item.rate);
                const tax = (base - Number(item.discount)) * (Number(item.tax_rate) / 100);
                const total = base - Number(item.discount) + tax;
                return (
                  <div key={item.id} className="p-3 rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-800">{idx + 1}. {item.description}</p>
                      <p className="font-semibold text-gray-900 shrink-0 ml-2">{formatINR(total)}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Qty: {item.qty}</span>
                      <span>Rate: {formatINR(Number(item.rate))}</span>
                      <span>Tax: {item.tax_rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="px-4 sm:px-8 py-4 sm:py-6" style={{ backgroundColor: '#E8F4F8' }}>
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatINR(Number(invoice.subtotal))}</span>
                </div>
                {Number(invoice.total_discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-medium" style={{ color: '#16a34a' }}>-{formatINR(Number(invoice.total_discount))}</span>
                  </div>
                )}
                {isIntraState ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CGST</span>
                      <span>{formatINR(cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SGST</span>
                      <span>{formatINR(sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IGST</span>
                    <span>{formatINR(igst)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3" style={{ borderTop: '2px solid #03556E' }}>
                  <span className="text-base sm:text-lg font-bold">Grand Total</span>
                  <span className="text-lg sm:text-xl font-bold" style={{ color: '#03556E' }}>{formatINR(Number(invoice.grand_total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-4 sm:px-8 py-4 border-t" style={{ borderColor: '#e5e7eb' }}>
              <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Notes</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 sm:px-8 py-4 text-center text-xs text-gray-400" style={{ backgroundColor: '#E8F4F8' }}>
            This is a computer-generated invoice and does not require a physical signature.
          </div>
        </div>
      </div>
    </div>
  );
}
