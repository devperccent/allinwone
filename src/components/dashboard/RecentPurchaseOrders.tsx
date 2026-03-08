import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import type { PurchaseOrder } from '@/hooks/usePurchaseOrders';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  received: { label: 'Received', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

export function RecentPurchaseOrders({ purchaseOrders }: { purchaseOrders: PurchaseOrder[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Recent Purchase Orders</h3>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7">
          <Link to="/purchase-orders">View all<ArrowRight className="w-3.5 h-3.5" /></Link>
        </Button>
      </div>
      <div className="divide-y divide-border">
        {purchaseOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No purchase orders yet</p>
          </div>
        ) : (
          purchaseOrders.map((po) => (
            <Link key={po.id} to={`/purchase-orders/${po.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{po.po_number}</p>
                <p className="text-xs text-muted-foreground truncate">{po.supplier_name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={cn('font-medium text-[10px] hidden sm:inline-flex', statusConfig[po.status]?.className)}>{statusConfig[po.status]?.label || po.status}</Badge>
                <span className="font-semibold tabular-nums text-sm">{formatINR(Number(po.grand_total))}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
