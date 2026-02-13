import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { useSendInvoiceEmail } from '@/hooks/useSendInvoiceEmail';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
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
  isGenerating,
  isFinalizing,
  isMarkingPaid,
  isDeleting,
}: {
  invoice: Invoice;
  onDownload: (invoice: Invoice) => void;
  onEmail: (invoice: Invoice) => void;
  onFinalize: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
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
            <DropdownMenuItem onClick={() => {
              const text = `Hi! Here's your invoice ${invoice.invoice_number} for ${formatINR(Number(invoice.grand_total))}. Please check and confirm.`;
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
          <DropdownMenuItem 
            onClick={() => onMarkPaid(invoice.id)}
            disabled={isMarkingPaid}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Paid
          </DropdownMenuItem>
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
  const { invoices, isLoading, finalizeInvoiceMutation, markAsPaid, deleteInvoice, getInvoiceWithItems } = useInvoices();
  const { generatePdf, isGenerating } = usePdfDownload();
  const { sendInvoiceEmail, isSending } = useSendInvoiceEmail();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        <Button asChild className="gap-2 w-full sm:w-auto">
          <Link to="/invoices/new">
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by invoice # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                      onMarkPaid={(id) => markAsPaid.mutate({ invoiceId: id, paymentMode: 'upi' })}
                      onDelete={(id) => deleteInvoice.mutate(id)}
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
                  onMarkPaid={(id) => markAsPaid.mutate({ invoiceId: id, paymentMode: 'upi' })}
                  onDelete={(id) => deleteInvoice.mutate(id)}
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
    </div>
  );
}
