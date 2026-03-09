import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Invoice, Client } from '@/types';

interface PaymentReminderButtonProps {
  invoice: Invoice;
  client?: Client | null;
  profileOrgName: string;
  profileUpiVpa?: string | null;
}

function buildUpiDeepLink(vpa: string, amount: number, invoiceNumber: string, orgName: string) {
  const params = new URLSearchParams({
    pa: vpa,
    pn: orgName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `Payment for ${invoiceNumber}`,
  });
  return `upi://pay?${params.toString()}`;
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export function PaymentReminderButton({ invoice, client, profileOrgName, profileUpiVpa }: PaymentReminderButtonProps) {
  const phone = client?.phone?.replace(/[^0-9]/g, '') || '';
  const amount = formatINR(Number(invoice.grand_total));

  const sendReminder = () => {
    const upiLink = profileUpiVpa
      ? buildUpiDeepLink(profileUpiVpa, Number(invoice.grand_total), invoice.invoice_number, profileOrgName)
      : '';

    const text = [
      `🙏 Namaste${client?.name ? ` ${client.name}` : ''}!`,
      ``,
      `This is a gentle reminder for payment of Invoice *${invoice.invoice_number}* amounting to *${amount}*.`,
      invoice.date_due ? `📅 Due date: ${new Date(invoice.date_due).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : '',
      ``,
      profileUpiVpa ? `💳 Pay via UPI: ${profileUpiVpa}` : '',
      upiLink ? `📱 Quick Pay: ${upiLink}` : '',
      ``,
      `Thank you!`,
      `— ${profileOrgName}`,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendThankYou = () => {
    const text = [
      `🙏 Thank you${client?.name ? ` ${client.name}` : ''}!`,
      ``,
      `We've received your payment for Invoice *${invoice.invoice_number}* (${amount}).`,
      ``,
      `We appreciate your prompt payment. Looking forward to serving you again!`,
      `— ${profileOrgName}`,
    ].join('\n');

    window.open(`https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!phone) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
          <MessageCircle className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {invoice.status !== 'paid' && (
          <DropdownMenuItem onClick={sendReminder}>
            💰 Send Payment Reminder
          </DropdownMenuItem>
        )}
        {invoice.status === 'paid' && (
          <DropdownMenuItem onClick={sendThankYou}>
            🙏 Send Thank You
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
