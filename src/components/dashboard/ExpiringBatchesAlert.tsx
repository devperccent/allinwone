import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProductBatches } from '@/hooks/useProductBatches';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function ExpiringBatchesAlert() {
  const { expiringBatches, expiredBatches } = useProductBatches();
  const { products } = useProducts();

  const allAlerts = [...expiredBatches, ...expiringBatches];
  if (allAlerts.length === 0) return null;

  const getProductName = (productId: string) =>
    products.find(p => p.id === productId)?.name || 'Unknown Product';

  const getDaysLeft = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="rounded-xl border border-warning/50 bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h3 className="font-semibold">Batch Expiry Alerts</h3>
        <Badge variant="secondary" className="text-xs">{allAlerts.length}</Badge>
      </div>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {allAlerts.slice(0, 10).map((batch) => {
          const days = batch.expiry_date ? getDaysLeft(batch.expiry_date) : null;
          const isExpired = days !== null && days <= 0;
          return (
            <div key={batch.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">{getProductName(batch.product_id)}</p>
                <p className="text-xs text-muted-foreground">
                  Batch: {batch.batch_number} • Qty: {batch.quantity}
                </p>
              </div>
              <div className="text-right">
                <Badge className={cn('text-xs', isExpired ? 'bg-destructive text-destructive-foreground' : 'bg-warning/20 text-warning')}>
                  {isExpired ? 'EXPIRED' : `${days}d left`}
                </Badge>
                {batch.expiry_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(batch.expiry_date), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
