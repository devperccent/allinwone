import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-primary',
}: StatCardProps) {
  return (
    <div className="stat-card" role="region" aria-label={`${title}: ${value}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide" id={`stat-title-${title.toLowerCase().replace(/\s/g, '-')}`}>
            {title}
          </p>
          <p className="text-2xl font-bold tabular-nums" aria-describedby={`stat-title-${title.toLowerCase().replace(/\s/g, '-')}`}>
            {value}
          </p>
          {change && (
            <p
              className={cn(
                'text-xs',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-muted-foreground'
              )}
              aria-label={`Status: ${change}`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg bg-muted/50', iconColor)} aria-hidden="true">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
