import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutCallbacks {
  onSearch?: () => void;
  onHelp?: () => void;
  onToggleTheme?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onHelp, onToggleTheme }: ShortcutCallbacks = {}) {
  const navigate = useNavigate();

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

      // Mod-key navigation shortcuts (⌘/Ctrl + Shift + letter)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const routes: Record<string, string> = {
          d: '/',
          h: '/',
          i: '/invoices',
          c: '/clients',
          p: '/products',
          r: '/reports',
          s: '/settings',
          q: '/quotations',
          o: '/purchase-orders',
          l: '/challans',
          b: '/purchase-bills',
          e: '/bulk',
          u: '/recurring',
        };
        const path = routes[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          navigate(path);
          return;
        }
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
      { keys: ['T'], description: 'Toggle dark / light mode' },
      { keys: ['Esc'], description: 'Blur / dismiss' },
    ],
  },
  {
    title: 'List Pages',
    shortcuts: [
      { keys: ['/'], description: 'Focus search field' },
      { keys: ['A'], description: 'Add new item' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: [modKey, '⇧', 'D'], description: 'Dashboard', separator: '+' },
      { keys: [modKey, '⇧', 'I'], description: 'Invoices', separator: '+' },
      { keys: [modKey, '⇧', 'C'], description: 'Clients', separator: '+' },
      { keys: [modKey, '⇧', 'P'], description: 'Products', separator: '+' },
      { keys: [modKey, '⇧', 'Q'], description: 'Quotations', separator: '+' },
      { keys: [modKey, '⇧', 'O'], description: 'Purchase Orders', separator: '+' },
      { keys: [modKey, '⇧', 'L'], description: 'Delivery Challans', separator: '+' },
      { keys: [modKey, '⇧', 'B'], description: 'Purchase Bills', separator: '+' },
      { keys: [modKey, '⇧', 'U'], description: 'Recurring Invoices', separator: '+' },
      { keys: [modKey, '⇧', 'R'], description: 'Reports', separator: '+' },
      { keys: [modKey, '⇧', 'E'], description: 'Import/Export', separator: '+' },
      { keys: [modKey, '⇧', 'S'], description: 'Settings', separator: '+' },
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
