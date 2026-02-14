import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import { InvoicePdfDocument } from '@/components/invoice/InvoicePdfDocument';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';

interface SendInvoiceEmailOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile;
  recipientEmail: string;
  showPaymentInfo?: boolean;
}

export function useSendInvoiceEmail() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendInvoiceEmail = useCallback(async ({
    invoice,
    items,
    client,
    profile,
    recipientEmail,
    showPaymentInfo = true,
  }: SendInvoiceEmailOptions) => {
    setIsSending(true);

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
      
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          recipientEmail,
          pdfBase64: base64,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email sent!',
        description: `Invoice sent to ${recipientEmail}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSending(false);
    }
  }, [toast]);

  return {
    sendInvoiceEmail,
    isSending,
  };
}
