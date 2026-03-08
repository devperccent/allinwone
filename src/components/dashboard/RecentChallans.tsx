import { Truck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DeliveryChallan } from '@/hooks/useDeliveryChallans';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  dispatched: { label: 'Dispatched', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

export function RecentChallans({ challans }: { challans: DeliveryChallan[] }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Recent Challans</h3>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
          <Link to="/challans">View all<ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
      <div className="divide-y divide-border">
        {challans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Truck className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No challans yet</p>
          </div>
        ) : (
          challans.map((c) => (
            <Link key={c.id} to={`/challans/${c.id}`} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{c.challan_number}</p>
                <p className="text-sm text-muted-foreground truncate">{c.client?.name || 'No client'} {c.vehicle_number ? `• ${c.vehicle_number}` : ''}</p>
              </div>
              <Badge className={cn('text-xs shrink-0', statusConfig[c.status]?.className)}>{statusConfig[c.status]?.label || c.status}</Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
