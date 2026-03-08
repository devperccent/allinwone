import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/types';

interface RecentInvoicesProps {
  invoices: Invoice[];
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-draft' },
  finalized: { label: 'Sent', className: 'status-finalized' },
  paid: { label: 'Paid', className: 'status-paid' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
};

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Recent Invoices</h3>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7">
          <Link to="/invoices">
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">No invoices yet</p>
            <Button variant="link" size="sm" asChild className="mt-1">
              <Link to="/invoices/new">Create your first invoice</Link>
            </Button>
          </div>
        ) : (
          invoices.map((invoice) => (
            <Link
              key={invoice.id}
              to={`/invoices/${invoice.id}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{invoice.invoice_number}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {invoice.client?.name || 'Walk-in Customer'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <Badge className={cn('font-medium text-[10px] hidden sm:inline-flex', statusConfig[invoice.status].className)}>
                  {statusConfig[invoice.status].label}
                </Badge>
                <span className="font-semibold tabular-nums text-sm">
                  {formatINR(invoice.grand_total)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
