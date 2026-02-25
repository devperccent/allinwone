import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutCallbacks {
  onSearch?: () => void;
  onHelp?: () => void;
  onToggleTheme?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onHelp, onToggleTheme }: ShortcutCallbacks = {}) {
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
          d: '/',
          h: '/',
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

      // Escape to blur focused element
      if (e.key === 'Escape') {
        if (document.activeElement && document.activeElement !== document.body) {
          (document.activeElement as HTMLElement).blur?.();
        }
        return;
      }

      // Toggle theme with T
      if (e.key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onToggleTheme?.();
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      clearTimeout(gTimeout.current);
    };
  }, [navigate, onSearch, onHelp, onToggleTheme, isInputFocused]);
}

import { modKey } from '@/lib/platform';

export const SHORTCUT_GROUPS = [
  {
    title: 'General',
    shortcuts: [
      { keys: [modKey, 'K'], description: 'Open search', separator: '+' },
      { keys: [modKey, 'S'], description: 'Save (in editor / settings)', separator: '+' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['N'], description: 'New invoice' },
      { keys: ['T'], description: 'Toggle dark/light mode' },
      { keys: ['Esc'], description: 'Blur / dismiss' },
    ],
  },
  {
    title: 'List Pages',
    shortcuts: [
      { keys: ['/'], description: 'Focus search field' },
      { keys: ['A'], description: 'Add new item (client / product)' },
    ],
  },
  {
    title: 'Navigation (press G then…)',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard', separator: 'then' },
      { keys: ['G', 'I'], description: 'Go to Invoices', separator: 'then' },
      { keys: ['G', 'C'], description: 'Go to Clients', separator: 'then' },
      { keys: ['G', 'P'], description: 'Go to Products', separator: 'then' },
      { keys: ['G', 'R'], description: 'Go to Reports', separator: 'then' },
      { keys: ['G', 'S'], description: 'Go to Settings', separator: 'then' },
    ],
  },
  {
    title: 'Invoice Editor',
    shortcuts: [
      { keys: [modKey, 'S'], description: 'Save invoice', separator: '+' },
      { keys: [modKey, '↩'], description: 'Finalize invoice', separator: '+' },
      { keys: [modKey, 'P'], description: 'Toggle preview', separator: '+' },
      { keys: [modKey, 'I'], description: 'Add line item', separator: '+' },
    ],
  },
];
