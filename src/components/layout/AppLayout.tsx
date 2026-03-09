import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { KeyboardShortcutsHint } from '@/components/onboarding/KeyboardShortcutsHint';
import { WalkthroughTutorial } from '@/components/onboarding/WalkthroughTutorial';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTheme } from '@/hooks/useTheme';

function RouteLoader() {
  return (
    <div className="flex items-center justify-center pt-24">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isMobile && <AppSidebar onOpenShortcuts={() => setShortcutsOpen(true)} />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader searchOpen={searchOpen} onSearchOpenChange={setSearchOpen} onOpenShortcuts={() => setShortcutsOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          <Suspense fallback={<RouteLoader />}>
            <Outlet context={{ setWalkthroughOpen }} />
          </Suspense>
        </main>
      </div>
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <KeyboardShortcutsHint onOpenShortcuts={() => setShortcutsOpen(true)} />
      <WalkthroughTutorial
        onComplete={() => {}}
        externalOpen={walkthroughOpen}
        onOpenChange={setWalkthroughOpen}
      />
    </div>
  );
}
