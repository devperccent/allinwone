import { useMemo, useState } from 'react';
import { MessageCircle, IndianRupee, Clock, AlertTriangle, Phone, StickyNote, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { Skeleton } from '@/components/ui/skeleton';
import type { Invoice, Client } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface OverdueInvoice extends Invoice {
  client?: Client;
  daysOverdue: number;
  bucket: 'due_today' | 'overdue_1_7' | 'overdue_8_15' | 'overdue_15_plus';
}

function buildWhatsAppReminder(invoice: Invoice, client: Client | undefined, orgName: string, tone: 'friendly' | 'firm' | 'final', upiVpa?: string | null) {
  const amount = formatINR(Number(invoice.grand_total));
  const due = invoice.date_due ? new Date(invoice.date_due).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  
  const messages = {
    friendly: [
      `🙏 Hi${client?.name ? ` ${client.name}` : ''},`,
      ``,
      `Just a gentle reminder about Invoice *${invoice.invoice_number}* for *${amount}*.`,
      due ? `📅 Due: ${due}` : '',
      ``,
      `Please let us know if you have any questions!`,
      upiVpa ? `💳 UPI: ${upiVpa}` : '',
      ``,
      `Thanks! — ${orgName}`,
    ],
    firm: [
      `Hi${client?.name ? ` ${client.name}` : ''},`,
      ``,
      `Your payment of *${amount}* for Invoice *${invoice.invoice_number}* is now overdue.`,
      due ? `📅 Was due: ${due}` : '',
      ``,
      `Please arrange payment at the earliest.`,
      upiVpa ? `💳 UPI: ${upiVpa}` : '',
      ``,
      `— ${orgName}`,
    ],
    final: [
      `Dear${client?.name ? ` ${client.name}` : ''},`,
      ``,
      `This is a final reminder for overdue Invoice *${invoice.invoice_number}* of *${amount}*.`,
      due ? `📅 Was due: ${due}` : '',
      ``,
      `We request immediate payment to avoid any service disruption.`,
      upiVpa ? `💳 UPI: ${upiVpa}` : '',
      ``,
      `— ${orgName}`,
    ],
  };

  return messages[tone].filter(Boolean).join('\n');
}

export default function CollectionsPage() {
  const { invoices, isLoading: invLoading } = useInvoices();
  const { clients } = useClients();
  const { reminders, logReminder } = usePayments();
  const { profile } = useAuth();
  const [noteDialog, setNoteDialog] = useState<{ invoice: OverdueInvoice } | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  const overdueInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return invoices
      .filter(inv => inv.status === 'finalized' && inv.date_due)
      .map(inv => {
        const due = new Date(inv.date_due!);
        due.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        const client = inv.client_id ? clientMap.get(inv.client_id) : undefined;
        
        let bucket: OverdueInvoice['bucket'];
        if (diff === 0) bucket = 'due_today';
        else if (diff >= 1 && diff <= 7) bucket = 'overdue_1_7';
        else if (diff >= 8 && diff <= 15) bucket = 'overdue_8_15';
        else if (diff > 15) bucket = 'overdue_15_plus';
        else return null; // not yet due

        return { ...inv, client, daysOverdue: diff, bucket } as OverdueInvoice;
      })
      .filter(Boolean) as OverdueInvoice[];
  }, [invoices, clientMap]);

  const buckets = useMemo(() => ({
    due_today: overdueInvoices.filter(i => i.bucket === 'due_today'),
    overdue_1_7: overdueInvoices.filter(i => i.bucket === 'overdue_1_7'),
    overdue_8_15: overdueInvoices.filter(i => i.bucket === 'overdue_8_15'),
    overdue_15_plus: overdueInvoices.filter(i => i.bucket === 'overdue_15_plus'),
  }), [overdueInvoices]);

  const totalOverdue = useMemo(() => 
    overdueInvoices.reduce((s, i) => s + Number(i.grand_total), 0),
    [overdueInvoices]
  );

  const sendReminder = (inv: OverdueInvoice, tone: 'friendly' | 'firm' | 'final') => {
    const phone = inv.client?.phone?.replace(/[^0-9]/g, '') || '';
    if (!phone) return;
    const text = buildWhatsAppReminder(inv, inv.client, profile?.org_name || '', tone, profile?.upi_vpa);
    const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    logReminder.mutate({
      invoice_id: inv.id,
      client_id: inv.client_id,
      reminder_type: tone,
      channel: 'whatsapp',
      follow_up_note: null,
    });
  };

  const sendAllToday = () => {
    for (const inv of overdueInvoices.slice(0, 5)) {
      const tone = inv.daysOverdue <= 7 ? 'friendly' : inv.daysOverdue <= 15 ? 'firm' : 'final';
      sendReminder(inv, tone);
    }
  };

  const saveFollowUp = () => {
    if (!noteDialog || !followUpNote.trim()) return;
    logReminder.mutate({
      invoice_id: noteDialog.invoice.id,
      client_id: noteDialog.invoice.client_id,
      reminder_type: 'note',
      channel: 'manual',
      follow_up_note: followUpNote.trim(),
    });
    setFollowUpNote('');
    setNoteDialog(null);
  };

  if (invLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40" /></div>;

  const renderInvoiceRow = (inv: OverdueInvoice) => {
    const phone = inv.client?.phone?.replace(/[^0-9]/g, '') || '';
    return (
      <div key={inv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {inv.client?.name || 'Walk-in'} — {inv.invoice_number}
          </p>
          <p className="text-xs text-muted-foreground">
            Due: {inv.date_due ? new Date(inv.date_due).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}
            {inv.daysOverdue > 0 && ` · ${inv.daysOverdue}d late`}
          </p>
        </div>
        <span className="text-sm font-bold text-destructive whitespace-nowrap">
          {formatINR(Number(inv.grand_total))}
        </span>
        <div className="flex gap-1">
          {phone && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => sendReminder(inv, 'friendly')} title="Friendly reminder">
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500" onClick={() => sendReminder(inv, 'firm')} title="Firm reminder">
                <Send className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setNoteDialog({ invoice: inv }); setFollowUpNote(''); }} title="Add note">
            <StickyNote className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const BucketCard = ({ title, items, color }: { title: string; items: OverdueInvoice[]; color: string }) => {
    if (items.length === 0) return null;
    const total = items.reduce((s, i) => s + Number(i.grand_total), 0);
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {title}
              <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
            </CardTitle>
            <span className="text-sm font-semibold text-destructive">{formatINR(total)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">{items.map(renderInvoiceRow)}</div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Collections</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track overdue payments & send reminders</p>
        </div>
        {overdueInvoices.length > 0 && (
          <Button size="sm" className="gap-1.5 h-9 text-xs" onClick={sendAllToday}>
            <MessageCircle className="w-3.5 h-3.5" />
            Send Today's Reminders
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Overdue</p>
            <p className="text-2xl font-bold text-destructive mt-1">{formatINR(totalOverdue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{overdueInvoices.length} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Due Today</p>
            <p className="text-xl font-bold mt-1">{buckets.due_today.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 1-7 Days Late</p>
            <p className="text-xl font-bold mt-1">{buckets.overdue_1_7.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600" /> 15+ Days Late</p>
            <p className="text-xl font-bold mt-1">{buckets.overdue_15_plus.length}</p>
          </CardContent>
        </Card>
      </div>

      {overdueInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">All clear! No overdue payments.</p>
            <p className="text-xs mt-1">Great job collecting on time 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <BucketCard title="Due Today" items={buckets.due_today} color="bg-yellow-500" />
          <BucketCard title="1–7 Days Late" items={buckets.overdue_1_7} color="bg-orange-500" />
          <BucketCard title="8–15 Days Late" items={buckets.overdue_8_15} color="bg-red-500" />
          <BucketCard title="15+ Days Late" items={buckets.overdue_15_plus} color="bg-red-700" />
        </div>
      )}

      {/* Follow-up note dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Follow-up Note</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {noteDialog?.invoice.client?.name} — {noteDialog?.invoice.invoice_number}
          </p>
          <Textarea
            placeholder="e.g. Customer promised payment on Friday"
            value={followUpNote}
            onChange={e => setFollowUpNote(e.target.value)}
            className="min-h-[80px]"
          />
          <Button onClick={saveFollowUp} className="w-full">Save Note</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
