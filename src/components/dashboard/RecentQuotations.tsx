import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import type { Quotation } from '@/hooks/useQuotations';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  converted: { label: 'Converted', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

export function RecentQuotations({ quotations }: { quotations: Quotation[] }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Recent Quotations</h3>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
          <Link to="/quotations">View all<ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
      <div className="divide-y divide-border">
        {quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No quotations yet</p>
          </div>
        ) : (
          quotations.map((q) => (
            <Link key={q.id} to={`/quotations/${q.id}`} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{q.quotation_number}</p>
                <p className="text-sm text-muted-foreground truncate">{q.client?.name || 'No client'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={cn('text-xs hidden sm:inline-flex', statusConfig[q.status]?.className)}>{statusConfig[q.status]?.label || q.status}</Badge>
                <span className="font-semibold tabular-nums text-sm">{formatINR(Number(q.grand_total))}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
