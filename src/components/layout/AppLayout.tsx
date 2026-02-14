import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function AppLayout() {
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen((o) => !o),
    onHelp: () => setShortcutsOpen((o) => !o),
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isMobile && <AppSidebar />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader searchOpen={searchOpen} onSearchOpenChange={setSearchOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
