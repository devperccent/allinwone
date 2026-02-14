import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePdfDocument } from '@/components/invoice/InvoicePdfDocument';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types';
import QRCode from 'qrcode';

interface UsePdfDownloadOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile;
  showPaymentInfo?: boolean;
}

export function usePdfDownload() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async ({
    invoice,
    items,
    client,
    profile,
    showPaymentInfo = true,
  }: UsePdfDownloadOptions) => {
    setIsGenerating(true);
    
    try {
      // Generate QR code
      let qrCodeDataUrl: string | undefined;
      
      if (profile.upi_vpa && Number(invoice.grand_total) > 0) {
        const upiString = `upi://pay?pa=${profile.upi_vpa}&pn=${encodeURIComponent(
          profile.org_name
        )}&am=${invoice.grand_total}&tr=${invoice.invoice_number}&tn=Invoice%20payment`;
        
        qrCodeDataUrl = await QRCode.toDataURL(upiString, {
          width: 200,
          margin: 1,
        });
      }

      // Generate PDF blob
      const doc = (
        <InvoicePdfDocument
          invoice={invoice}
          items={items}
          client={client}
          profile={profile}
          qrCodeDataUrl={qrCodeDataUrl}
          showPaymentInfo={showPaymentInfo}
        />
      );
      
      const blob = await pdf(doc).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePdf,
    isGenerating,
  };
}
