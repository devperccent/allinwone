import { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  Download,
  Mail,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  MessageCircle,
  Share2,
  Bell,
  FileSpreadsheet,
  Calendar,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { useSendInvoiceEmail } from '@/hooks/useSendInvoiceEmail';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { exportInvoicesToCSV } from '@/utils/csvExport';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Invoice, InvoiceStatus, PaymentMode } from '@/types';

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-draft' },
  finalized: { label: 'Sent', className: 'status-finalized' },
  paid: { label: 'Paid', className: 'status-paid' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
};

function InvoiceActions({
  invoice,
  onDownload,
  onEmail,
  onFinalize,
  onMarkPaid,
  onDelete,
  onShare,
  onRemind,
  isGenerating,
  isFinalizing,
  isMarkingPaid,
  isDeleting,
}: {
  invoice: Invoice;
  onDownload: (invoice: Invoice) => void;
  onEmail: (invoice: Invoice) => void;
  onFinalize: (id: string) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onShare: (invoice: Invoice) => void;
  onRemind: (invoice: Invoice) => void;
  isGenerating: boolean;
  isFinalizing: boolean;
  isMarkingPaid: boolean;
  isDeleting: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/invoices/${invoice.id}`}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </Link>
        </DropdownMenuItem>
        {invoice.status === 'draft' && (
          <DropdownMenuItem asChild>
            <Link to={`/invoices/${invoice.id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDownload(invoice)} disabled={isGenerating}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
        {invoice.status !== 'draft' && (
          <>
            <DropdownMenuItem onClick={() => onEmail(invoice)}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(invoice)}>
              <Share2 className="w-4 h-4 mr-2" />
              Get Shareable Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async () => {
              let token = invoice.share_token;
              if (!token) {
                const { data, error } = await supabase.rpc('generate_share_token');
                if (error) { console.error(error); return; }
                token = data;
                await supabase.from('invoices').update({ share_token: token }).eq('id', invoice.id);
              }
              const link = `${window.location.origin}/invoice/view?token=${token}`;
              const text = `Hi! Here's your invoice ${invoice.invoice_number} for ${formatINR(Number(invoice.grand_total))}. View it here: ${link}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        {invoice.status === 'draft' && (
          <DropdownMenuItem
            onClick={() => onFinalize(invoice.id)}
            disabled={isFinalizing}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Finalize & Send
          </DropdownMenuItem>
        )}
        {invoice.status === 'finalized' && (
          <>
            <DropdownMenuItem
              onClick={() => onMarkPaid(invoice)}
              disabled={isMarkingPaid}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemind(invoice)}>
              <Bell className="w-4 h-4 mr-2" />
              Send Reminder
            </DropdownMenuItem>
          </>
        )}
        {invoice.status === 'draft' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(invoice.id)}
              className="text-destructive focus:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function InvoicesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invoices, isLoading, finalizeInvoiceMutation, markAsPaid, deleteInvoice, getInvoiceWithItems } = useInvoices();
  const { generatePdf, isGenerating } = usePdfDownload();
  const { sendInvoiceEmail, isSending } = useSendInvoiceEmail();
  const searchRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  // Mark as Paid dialog state
  const [paidDialogOpen, setPaidDialogOpen] = useState(false);
  const [paidInvoice, setPaidInvoice] = useState<Invoice | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Share link state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Page shortcuts: / → focus search, N → new invoice
  usePageShortcuts(useMemo(() => [
    { key: '/', handler: () => searchRef.current?.focus() },
  ], []));

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesDateFrom = !dateFrom || invoice.date_issued >= dateFrom;
    const matchesDateTo = !dateTo || invoice.date_issued <= dateTo;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const handleDownload = async (invoice: Invoice) => {
    if (!profile) return;
    try {
      const fullInvoice = await getInvoiceWithItems(invoice.id);
      await generatePdf({
        invoice: {
          ...fullInvoice,
          status: fullInvoice.status as InvoiceStatus,
          payment_mode: fullInvoice.payment_mode as PaymentMode | null,
        },
        items: fullInvoice.items || [],
        client: fullInvoice.client || null,
        profile,
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedInvoice || !profile || !recipientEmail) return;
    try {
      const fullInvoice = await getInvoiceWithItems(selectedInvoice.id);
      await sendInvoiceEmail({
        invoice: {
          ...fullInvoice,
          status: fullInvoice.status as InvoiceStatus,
          payment_mode: fullInvoice.payment_mode as PaymentMode | null,
        },
        items: fullInvoice.items || [],
        client: fullInvoice.client || null,
        profile,
        recipientEmail,
      });
      setEmailDialogOpen(false);
      setRecipientEmail('');
    } catch (error) {
      console.error('Email error:', error);
    }
  };

  const openEmailDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setRecipientEmail(invoice.client?.email || '');
    setEmailDialogOpen(true);
  };

  const openPaidDialog = (invoice: Invoice) => {
    setPaidInvoice(invoice);
    setPaymentMode('upi');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaidDialogOpen(true);
  };

  const handleMarkPaid = () => {
    if (!paidInvoice) return;
    markAsPaid.mutate(
      { invoiceId: paidInvoice.id, paymentMode },
      {
        onSuccess: async () => {
          // Also update payment_date
          await supabase
            .from('invoices')
            .update({ payment_date: paymentDate })
            .eq('id', paidInvoice.id);
          setPaidDialogOpen(false);
        },
      }
    );
  };

  const handleShare = async (invoice: Invoice) => {
    setIsGeneratingLink(true);
    setShareDialogOpen(true);
    setLinkCopied(false);

    try {
      let token = invoice.share_token;
      if (!token) {
        // Generate a share token
        const { data, error } = await supabase.rpc('generate_share_token');
        if (error) throw error;
        token = data;

        await supabase
          .from('invoices')
          .update({ share_token: token })
          .eq('id', invoice.id);
      }

      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/invoice/view?token=${token}`);
    } catch (err: any) {
      toast({ title: 'Error generating link', description: err.message, variant: 'destructive' });
      setShareDialogOpen(false);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    toast({ title: 'Link copied!', description: 'Share this link with your client.' });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleRemind = (invoice: Invoice) => {
    // Open email dialog pre-filled as a reminder
    setSelectedInvoice(invoice);
    setRecipientEmail(invoice.client?.email || '');
    setEmailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage and track all your invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportInvoicesToCSV(filteredInvoices)}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/invoices/new">
              <Plus className="w-4 h-4" />
              New Invoice
              <kbd className="ml-1 hidden sm:inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium text-primary-foreground/70">N</kbd>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search by invoice # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">/</kbd>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="finalized">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-10 w-40"
              placeholder="From"
            />
          </div>
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="rounded-xl border border-border bg-card overflow-hidden hidden md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No invoices found</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/invoices/new">Create your first invoice</Link>
                  </Button>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td>{invoice.client?.name || 'Walk-in Customer'}</td>
                  <td className="tabular-nums">{invoice.date_issued}</td>
                  <td className="tabular-nums">{invoice.date_due || '-'}</td>
                  <td className="font-semibold tabular-nums">
                    {formatINR(Number(invoice.grand_total))}
                  </td>
                  <td>
                    <Badge className={cn('font-medium', statusConfig[invoice.status].className)}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </td>
                  <td>
                    <InvoiceActions
                      invoice={invoice}
                      onDownload={handleDownload}
                      onEmail={openEmailDialog}
                      onFinalize={(id) => finalizeInvoiceMutation.mutate(id)}
                      onMarkPaid={openPaidDialog}
                      onDelete={(id) => deleteInvoice.mutate(id)}
                      onShare={handleShare}
                      onRemind={handleRemind}
                      isGenerating={isGenerating}
                      isFinalizing={finalizeInvoiceMutation.isPending}
                      isMarkingPaid={markAsPaid.isPending}
                      isDeleting={deleteInvoice.isPending}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Card list - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-card">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No invoices found</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/invoices/new">Create your first invoice</Link>
            </Button>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <Link to={`/invoices/${invoice.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-primary">{invoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground truncate">{invoice.client?.name || 'Walk-in Customer'}</p>
                </Link>
                <InvoiceActions
                  invoice={invoice}
                  onDownload={handleDownload}
                  onEmail={openEmailDialog}
                  onFinalize={(id) => finalizeInvoiceMutation.mutate(id)}
                  onMarkPaid={openPaidDialog}
                  onDelete={(id) => deleteInvoice.mutate(id)}
                  onShare={handleShare}
                  onRemind={handleRemind}
                  isGenerating={isGenerating}
                  isFinalizing={finalizeInvoiceMutation.isPending}
                  isMarkingPaid={markAsPaid.isPending}
                  isDeleting={deleteInvoice.isPending}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Badge className={cn('font-medium', statusConfig[invoice.status].className)}>
                    {statusConfig[invoice.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">{invoice.date_issued}</span>
                </div>
                <span className="font-semibold tabular-nums">{formatINR(Number(invoice.grand_total))}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice via Email</DialogTitle>
            <DialogDescription>
              Send {selectedInvoice?.invoice_number} to the client.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@example.com"
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending || !recipientEmail}>
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={paidDialogOpen} onOpenChange={setPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for {paidInvoice?.invoice_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMode}
                onValueChange={(v) => setPaymentMode(v as PaymentMode)}
                className="mt-2 grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'upi', label: 'UPI' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'credit', label: 'Bank Transfer' },
                  { value: 'split', label: 'Card' },
                ].map((mode) => (
                  <Label
                    key={mode.value}
                    htmlFor={mode.value}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors',
                      paymentMode === mode.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/30'
                    )}
                  >
                    <RadioGroupItem value={mode.value} id={mode.value} />
                    <span className="font-medium">{mode.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaidDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={markAsPaid.isPending}>
              {markAsPaid.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Link Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shareable Invoice Link</DialogTitle>
            <DialogDescription>
              Anyone with this link can view the invoice — no login required.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isGeneratingLink ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button size="icon" variant="outline" onClick={copyShareLink}>
                  {linkCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
