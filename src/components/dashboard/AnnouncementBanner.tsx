import { useActiveAnnouncements } from '@/hooks/useAdminActions';
import { AlertCircle, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

const ICONS: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  critical: AlertCircle,
};

const STYLES: Record<string, string> = {
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
  success: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300',
  critical: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
};

export function AnnouncementBanner() {
  const { data: announcements } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = announcements?.filter(a => !dismissed.has(a.id)) || [];
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((ann: any) => {
        const Icon = ICONS[ann.type] || Info;
        return (
          <div key={ann.id} className={`flex items-start gap-3 p-3 rounded-lg border ${STYLES[ann.type] || STYLES.info}`}>
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{ann.title}</p>
              <p className="text-sm opacity-80">{ann.message}</p>
            </div>
            <button onClick={() => setDismissed(prev => new Set(prev).add(ann.id))} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
