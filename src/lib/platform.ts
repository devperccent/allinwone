/**
 * Platform detection & keyboard shortcut utilities.
 * Shows ⌘ on Mac, Ctrl on Windows/Linux.
 */

const isMacPlatform =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

export const isMac = isMacPlatform;

/** Returns the modifier key symbol for the current OS */
export const modKey = isMac ? '⌘' : 'Ctrl';

/** Maps abstract key names to OS-specific display symbols */
export function formatKey(key: string): string {
  const map: Record<string, string> = {
    mod: modKey,
    Meta: '⌘',
    Control: 'Ctrl',
    Alt: isMac ? '⌥' : 'Alt',
    Shift: isMac ? '⇧' : 'Shift',
    Enter: isMac ? '↩' : 'Enter',
    Backspace: isMac ? '⌫' : 'Backspace',
    Delete: isMac ? '⌦' : 'Del',
    Escape: 'Esc',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };
  return map[key] ?? key;
}

/** Renders a shortcut like ['mod', 'K'] → ['⌘', 'K'] or ['Ctrl', 'K'] */
export function formatShortcut(keys: string[]): string[] {
  return keys.map(formatKey);
}
