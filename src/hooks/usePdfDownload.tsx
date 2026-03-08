import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePdfDocument } from '@/components/invoice/InvoicePdfDocument';
import { ChallanPdfDocument } from '@/components/pdf/ChallanPdfDocument';
import { PurchaseOrderPdfDocument } from '@/components/pdf/PurchaseOrderPdfDocument';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types';
import type { DeliveryChallan, ChallanItem } from '@/hooks/useDeliveryChallans';
import type { PurchaseOrder, POItem } from '@/hooks/usePurchaseOrders';
import type { InvoiceTemplate } from '@/components/invoice/invoiceTemplates';
import QRCode from 'qrcode';

interface UsePdfDownloadOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile;
  showPaymentInfo?: boolean;
  template?: InvoiceTemplate;
}

interface ChallanPdfOptions {
  challan: DeliveryChallan;
  items: ChallanItem[];
  client: Client | null;
  profile: Profile;
}

interface POPdfOptions {
  po: PurchaseOrder;
  items: POItem[];
  profile: Profile;
}

export function usePdfDownload() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async ({
    invoice, items, client, profile, showPaymentInfo = true,
  }: UsePdfDownloadOptions) => {
    setIsGenerating(true);
    try {
      let qrCodeDataUrl: string | undefined;
      if (profile.upi_vpa && Number(invoice.grand_total) > 0) {
        const upiString = `upi://pay?pa=${profile.upi_vpa}&pn=${encodeURIComponent(profile.org_name)}&am=${invoice.grand_total}&tr=${invoice.invoice_number}&tn=Invoice%20payment`;
        qrCodeDataUrl = await QRCode.toDataURL(upiString, { width: 200, margin: 1 });
      }
      const doc = (
        <InvoicePdfDocument invoice={invoice} items={items} client={client} profile={profile} qrCodeDataUrl={qrCodeDataUrl} showPaymentInfo={showPaymentInfo} />
      );
      const blob = await pdf(doc).toBlob();
      downloadBlob(blob, `${invoice.invoice_number}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateChallanPdf = useCallback(async ({ challan, items, client, profile }: ChallanPdfOptions) => {
    setIsGenerating(true);
    try {
      const doc = <ChallanPdfDocument challan={challan} items={items} client={client} profile={profile} />;
      const blob = await pdf(doc).toBlob();
      downloadBlob(blob, `${challan.challan_number}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generatePOPdf = useCallback(async ({ po, items, profile }: POPdfOptions) => {
    setIsGenerating(true);
    try {
      const doc = <PurchaseOrderPdfDocument po={po} items={items} profile={profile} />;
      const blob = await pdf(doc).toBlob();
      downloadBlob(blob, `${po.po_number}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePdf, generateChallanPdf, generatePOPdf, isGenerating };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
