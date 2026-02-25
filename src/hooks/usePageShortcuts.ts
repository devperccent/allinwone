import { useEffect } from 'react';

/**
 * Page-level keyboard shortcut hook.
 * Registers shortcuts that only fire when not in an input field.
 * Each shortcut is a { key, mod?, shift?, handler } object.
 *
 * `mod` means ⌘ on Mac and Ctrl on Windows.
 */
interface PageShortcut {
  key: string;
  mod?: boolean;
  shift?: boolean;
  handler: () => void;
}

export function usePageShortcuts(shortcuts: PageShortcut[]) {
  useEffect(() => {
    if (shortcuts.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = el?.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement)?.isContentEditable;

      for (const s of shortcuts) {
        const modMatch = s.mod ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
        const shiftMatch = s.shift ? e.shiftKey : true; // shift is optional filter
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();

        if (keyMatch && modMatch && shiftMatch) {
          // Allow mod shortcuts even in inputs, but block plain key shortcuts in inputs
          if (!s.mod && isInput) continue;
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
