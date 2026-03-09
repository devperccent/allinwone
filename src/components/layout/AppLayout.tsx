import { useState, useEffect, Suspense, lazy, memo } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTheme } from '@/hooks/useTheme';
import { useAccessibility } from '@/hooks/useAccessibility';

// Lazy-load dialogs that aren't needed on initial render
const KeyboardShortcutsDialog = lazy(() => import('./KeyboardShortcutsDialog').then(m => ({ default: m.KeyboardShortcutsDialog })));
const KeyboardShortcutsHint = lazy(() => import('@/components/onboarding/KeyboardShortcutsHint').then(m => ({ default: m.KeyboardShortcutsHint })));
const WalkthroughTutorial = lazy(() => import('@/components/onboarding/WalkthroughTutorial').then(m => ({ default: m.WalkthroughTutorial })));

function RouteLoader() {
  return (
    <div className="flex items-center justify-center pt-24" role="status" aria-label="Loading page">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}

const MemoizedSidebar = memo(AppSidebar);

export function AppLayout() {
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(isDark ? 'light' : 'dark');
  };

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen((o) => !o),
    onHelp: () => setShortcutsOpen((o) => !o),
    onToggleTheme: toggleTheme,
  });

  // Initialize accessibility settings on mount
  useAccessibility();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip to content link for keyboard users */}
      <a href="#main-content" className="skip-to-content" aria-label="Skip to main content">
        Skip to main content
      </a>
      {!isMobile && (
        <aside aria-label="Main navigation">
          <MemoizedSidebar onOpenShortcuts={() => setShortcutsOpen(true)} />
        </aside>
      )}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader searchOpen={searchOpen} onSearchOpenChange={setSearchOpen} onOpenShortcuts={() => setShortcutsOpen(true)} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-5"
          tabIndex={-1}
          role="main"
          aria-label="Page content"
        >
          {/* Live region for page announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only" id="page-announcer" />
          <Suspense fallback={<RouteLoader />}>
            <Outlet context={{ setWalkthroughOpen }} />
          </Suspense>
        </main>
      </div>
      <Suspense fallback={null}>
        {shortcutsOpen && <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />}
        <KeyboardShortcutsHint onOpenShortcuts={() => setShortcutsOpen(true)} />
        {walkthroughOpen && (
          <WalkthroughTutorial
            onComplete={() => {}}
            externalOpen={walkthroughOpen}
            onOpenChange={setWalkthroughOpen}
          />
        )}
      </Suspense>
    </div>
  );
}
