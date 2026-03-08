import { useState, useEffect, useCallback } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { modKey } from '@/lib/platform';
import { useIsMobile } from '@/hooks/use-mobile';

const STORAGE_KEY = 'inw-shortcuts-hint-dismissed';
const ENABLED_KEY = 'inw-shortcuts-hint-enabled';

export function isKeyboardHintsEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'true';
}

export function setKeyboardHintsEnabled(enabled: boolean) {
  localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    localStorage.setItem(STORAGE_KEY, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Dispatch storage event so the hint component reacts immediately
  window.dispatchEvent(new CustomEvent('keyboard-hints-changed', { detail: enabled }));
}

interface KeyboardShortcutsHintProps {
  onOpenShortcuts: () => void;
}

export function KeyboardShortcutsHint({ onOpenShortcuts }: KeyboardShortcutsHintProps) {
  const [visible, setVisible] = useState(false);
  const isMobile = useIsMobile();

  const checkAndShow = useCallback(() => {
    if (isMobile) return;
    if (!isKeyboardHintsEnabled()) {
      setVisible(false);
      return;
    }
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    if (!isKeyboardHintsEnabled()) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Listen for toggle changes from settings
  useEffect(() => {
    const handler = (e: Event) => {
      const enabled = (e as CustomEvent).detail;
      if (enabled) {
        checkAndShow();
      } else {
        setVisible(false);
      }
    };
    window.addEventListener('keyboard-hints-changed', handler);
    return () => window.removeEventListener('keyboard-hints-changed', handler);
  }, [checkAndShow]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500 max-w-sm">
      <div className="rounded-xl border border-border bg-card shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Keyboard className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">⌨️ Keyboard shortcuts available!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Speed up your workflow with shortcuts like{' '}
              <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">{modKey}</kbd>
              <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground ml-0.5">K</kbd>
              {' '}to search and{' '}
              <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">N</kbd>
              {' '}for a new invoice.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => {
                  dismiss();
                  onOpenShortcuts();
                }}
              >
                View all shortcuts
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={dismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground"
            onClick={dismiss}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
