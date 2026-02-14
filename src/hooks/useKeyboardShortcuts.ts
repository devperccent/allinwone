import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutCallbacks {
  onSearch?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onHelp }: ShortcutCallbacks = {}) {
  const navigate = useNavigate();
  const gPressed = useRef(false);
  const gTimeout = useRef<ReturnType<typeof setTimeout>>();

  const isInputFocused = useCallback(() => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Always handle ⌘K regardless of focus
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // Skip other shortcuts when typing in inputs
      if (isInputFocused()) return;

      // ? → help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onHelp?.();
        return;
      }

      // "g" prefix navigation (g then letter)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !gPressed.current) {
        gPressed.current = true;
        clearTimeout(gTimeout.current);
        gTimeout.current = setTimeout(() => { gPressed.current = false; }, 800);
        return;
      }

      if (gPressed.current) {
        gPressed.current = false;
        clearTimeout(gTimeout.current);
        const routes: Record<string, string> = {
          d: '/dashboard',
          h: '/dashboard',
          i: '/invoices',
          c: '/clients',
          p: '/products',
          r: '/reports',
          s: '/settings',
        };
        const path = routes[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          navigate(path);
          return;
        }
      }

      // Direct shortcuts (no modifier)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        navigate('/invoices/new');
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      clearTimeout(gTimeout.current);
    };
  }, [navigate, onSearch, onHelp, isInputFocused]);
}

export const SHORTCUT_GROUPS = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open search' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['N'], description: 'New invoice' },
    ],
  },
  {
    title: 'Navigation (press G then...)',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'I'], description: 'Go to Invoices' },
      { keys: ['G', 'C'], description: 'Go to Clients' },
      { keys: ['G', 'P'], description: 'Go to Products' },
      { keys: ['G', 'R'], description: 'Go to Reports' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
];
