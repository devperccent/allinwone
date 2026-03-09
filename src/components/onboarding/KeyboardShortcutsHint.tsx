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
  const [enabled, setEnabled] = useState(isKeyboardHintsEnabled());
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: Event) => {
      setEnabled((e as CustomEvent).detail);
    };
    window.addEventListener('keyboard-hints-changed', handler);
    return () => window.removeEventListener('keyboard-hints-changed', handler);
  }, []);

  if (!enabled || isMobile) return null;

  return null;
}

/**
 * Inline sidebar keyboard hint shown when hints are enabled and sidebar is expanded.
 */
interface SidebarKeyboardHintProps {
  onOpenShortcuts: () => void;
  collapsed: boolean;
}

export function SidebarKeyboardHint({ onOpenShortcuts, collapsed }: SidebarKeyboardHintProps) {
  const [enabled, setEnabled] = useState(isKeyboardHintsEnabled());

  useEffect(() => {
    const handler = (e: Event) => {
      setEnabled((e as CustomEvent).detail);
    };
    window.addEventListener('keyboard-hints-changed', handler);
    return () => window.removeEventListener('keyboard-hints-changed', handler);
  }, []);

  if (!enabled || collapsed) return null;

  return (
    <button
      onClick={onOpenShortcuts}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
    >
      <Keyboard className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 text-left">Shortcuts</span>
      <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">?</kbd>
    </button>
  );
}
