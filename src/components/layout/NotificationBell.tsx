import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X, Info, AlertTriangle, CheckCircle, XCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, type Notification, type NotificationFilter } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeColors: Record<string, string> = {
  info: 'text-blue-500 bg-blue-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  error: 'text-destructive bg-destructive/10',
};

const filters: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'warning', label: 'Alerts' },
  { value: 'success', label: 'Success' },
];

function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (n: Notification) => void;
}) {
  const TypeIcon = typeIcons[notification.type] || Info;
  const colorClasses = typeColors[notification.type] || 'text-muted-foreground bg-muted';

  return (
    <div
      className={cn(
        'group/item relative flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40',
        !notification.is_read && 'bg-primary/[0.03]'
      )}
    >
      <button
        onClick={() => {
          if (!notification.is_read) onRead(notification.id);
          onNavigate(notification);
        }}
        className="flex items-start gap-3 flex-1 min-w-0 text-left"
      >
        <div className={cn('mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center', colorClasses)}>
          <TypeIcon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm leading-tight', !notification.is_read ? 'font-semibold' : 'font-medium')}>
              {notification.title}
            </span>
            {!notification.is_read && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notification.message}</p>
          <span className="text-[10px] text-muted-foreground/70 mt-1.5 block">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 mt-1 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
        title="Delete"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll, getFiltered } =
    useNotifications();

  const filtered = getFiltered(filter);

  const handleNavigate = (n: Notification) => {
    if (n.entity_type === 'invoice' && n.entity_id) {
      navigate(`/invoices/${n.entity_id}`);
    } else if (n.entity_type === 'product') {
      navigate('/products');
    } else if (n.entity_type === 'client') {
      navigate('/clients');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1 animate-in zoom-in-50">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] md:w-[420px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-1.5">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                onClick={() => clearAll.mutate()}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filter === f.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
              {f.value === 'unread' && unreadCount > 0 && (
                <span className="ml-1 opacity-80">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>

        <Separator />

        {/* List */}
        <ScrollArea className="max-h-[420px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm font-medium">
                {filter === 'all' ? 'All caught up!' : `No ${filter} notifications`}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {filter === 'all' ? 'You have no notifications right now' : 'Try checking another filter'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={(id) => markAsRead.mutate(id)}
                  onDelete={(id) => deleteNotification.mutate(id)}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2.5 text-center">
              <span className="text-[10px] text-muted-foreground/60">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {unreadCount > 0 && ` · ${unreadCount} unread`}
              </span>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
