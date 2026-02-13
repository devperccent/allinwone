import { useActivityLogs } from '@/hooks/useActivityLogs';
import { FileText, Users, Package, Activity, ArrowDown, ArrowUp, CheckCircle, Trash2, Edit, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: PlusCircle, label: 'Created', color: 'text-emerald-500' },
  updated: { icon: Edit, label: 'Updated', color: 'text-blue-500' },
  finalized: { icon: CheckCircle, label: 'Finalized', color: 'text-primary' },
  marked_paid: { icon: CheckCircle, label: 'Marked paid', color: 'text-emerald-500' },
  deleted: { icon: Trash2, label: 'Deleted', color: 'text-destructive' },
  stock_adjusted: { icon: ArrowDown, label: 'Stock adjusted', color: 'text-warning' },
};

const ENTITY_ICON: Record<string, React.ElementType> = {
  invoice: FileText,
  client: Users,
  product: Package,
};

export function ActivityFeed() {
  const { data: logs, isLoading } = useActivityLogs(10);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Activity Feed
        </h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" /> Activity Feed
      </h3>
      {!logs || logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No activity yet. Start by creating an invoice, product, or client.
        </p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated;
            const EntityIcon = ENTITY_ICON[log.entity_type] || FileText;
            const ActionIcon = config.icon;

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <div className={`mt-0.5 p-1.5 rounded-lg bg-muted ${config.color}`}>
                  <ActionIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{config.label}</span>{' '}
                    <span className="text-muted-foreground">{log.entity_type}</span>{' '}
                    {log.entity_label && (
                      <span className="font-medium truncate">{log.entity_label}</span>
                    )}
                  </p>
                  {log.action === 'stock_adjusted' && log.metadata && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.metadata.old_qty} → {log.metadata.new_qty} units
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
