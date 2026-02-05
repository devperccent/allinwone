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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Recent Invoices</h3>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
          <Link to="/invoices">
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No invoices yet</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/invoices/new">Create your first invoice</Link>
            </Button>
          </div>
        ) : (
          invoices.map((invoice) => (
            <Link
              key={invoice.id}
              to={`/invoices/${invoice.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.client?.name || 'Walk-in Customer'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge className={cn('font-medium', statusConfig[invoice.status].className)}>
                  {statusConfig[invoice.status].label}
                </Badge>
                <span className="font-semibold tabular-nums">
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
