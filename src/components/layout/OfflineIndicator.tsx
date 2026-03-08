import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, doSync } = useOfflineSync();

  // Fully online with no pending = don't show anything
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Pending sync badge */}
      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8 px-2"
              onClick={doSync}
              disabled={isSyncing || !isOnline}
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudOff className="w-3.5 h-3.5" />
              )}
              <span className="text-xs tabular-nums">{pendingCount}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing
              ? 'Syncing offline changes...'
              : isOnline
                ? `${pendingCount} pending changes. Click to sync.`
                : `${pendingCount} changes queued. Will sync when online.`}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Offline badge */}
      {!isOnline && (
        <Badge variant="destructive" className="gap-1 text-xs py-0.5">
          <WifiOff className="w-3 h-3" />
          Offline
        </Badge>
      )}
    </div>
  );
}
