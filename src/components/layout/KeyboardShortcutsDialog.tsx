import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SHORTCUT_GROUPS } from '@/hooks/useKeyboardShortcuts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">{group.title}</h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.description} className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-xs text-muted-foreground mx-0.5">+</span>}
                          <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
