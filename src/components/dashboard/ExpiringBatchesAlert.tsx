import { AlertTriangle } from 'lucide-react';
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
    <div className="rounded-lg border border-warning/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold">Batch Expiry Alerts</h3>
        <Badge variant="secondary" className="text-[10px] h-5">{allAlerts.length}</Badge>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {allAlerts.slice(0, 10).map((batch) => {
          const days = batch.expiry_date ? getDaysLeft(batch.expiry_date) : null;
          const isExpired = days !== null && days <= 0;
          return (
            <div key={batch.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
              <div>
                <p className="text-xs font-medium">{getProductName(batch.product_id)}</p>
                <p className="text-[10px] text-muted-foreground">
                  Batch: {batch.batch_number} • Qty: {batch.quantity}
                </p>
              </div>
              <div className="text-right">
                <Badge className={cn('text-[10px]', isExpired ? 'bg-destructive text-destructive-foreground' : 'bg-warning/20 text-warning')}>
                  {isExpired ? 'EXPIRED' : `${days}d left`}
                </Badge>
                {batch.expiry_date && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
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
