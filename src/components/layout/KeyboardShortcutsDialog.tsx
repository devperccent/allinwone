import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SHORTCUT_GROUPS } from '@/hooks/useKeyboardShortcuts';
import { isKeyboardHintsEnabled, setKeyboardHintsEnabled } from '@/components/onboarding/KeyboardShortcutsHint';
import { useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  const [hintsEnabled, setHintsEnabled] = useState(isKeyboardHintsEnabled());

  const handleToggle = (checked: boolean) => {
    setHintsEnabled(checked);
    setKeyboardHintsEnabled(checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-2" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <div className="space-y-5 py-3">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  {group.title}
                </h4>
                <div className="space-y-1.5">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="flex items-center">
                            {i > 0 && (
                              <span className="text-[10px] text-muted-foreground mx-0.5">
                                {(shortcut as any).separator || '+'}
                              </span>
                            )}
                            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground shadow-sm">
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
        </ScrollArea>

        <Separator />
        <div className="px-6 py-4 flex items-center justify-between">
          <Label htmlFor="hint-toggle" className="text-sm cursor-pointer">
            Show keyboard hints in sidebar
          </Label>
          <Switch
            id="hint-toggle"
            checked={hintsEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
