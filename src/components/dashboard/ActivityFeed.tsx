import { useActivityLogs } from '@/hooks/useActivityLogs';
import { FileText, Users, Package, Activity, CheckCircle, Trash2, Edit, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: PlusCircle, label: 'Created', color: 'text-success' },
  updated: { icon: Edit, label: 'Updated', color: 'text-info' },
  finalized: { icon: CheckCircle, label: 'Finalized', color: 'text-primary' },
  marked_paid: { icon: CheckCircle, label: 'Marked paid', color: 'text-success' },
  deleted: { icon: Trash2, label: 'Deleted', color: 'text-destructive' },
  stock_adjusted: { icon: Edit, label: 'Stock adjusted', color: 'text-warning' },
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
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary" /> Activity
        </h3>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Activity className="w-4 h-4 text-primary" /> Activity
      </h3>
      {!logs || logs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No activity yet. Start by creating an invoice, product, or client.
        </p>
      ) : (
        <div className="space-y-0.5">
          {logs.map((log) => {
            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated;
            const ActionIcon = config.icon;

            return (
              <div
                key={log.id}
                className="flex items-center gap-2.5 py-1.5 px-1.5 rounded hover:bg-muted/30 transition-colors"
              >
                <div className={`p-1 rounded bg-muted ${config.color}`}>
                  <ActionIcon className="w-3 h-3" />
                </div>
                <p className="flex-1 min-w-0 text-xs leading-snug">
                  <span className="font-medium">{config.label}</span>{' '}
                  <span className="text-muted-foreground">{log.entity_type}</span>{' '}
                  {log.entity_label && <span className="font-medium truncate">{log.entity_label}</span>}
                </p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
