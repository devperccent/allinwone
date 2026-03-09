import { lazy, Suspense, memo } from 'react';
import { Search, Plus, Moon, Sun, Menu, Settings, LogOut, BookOpen, ShieldCheck, Keyboard } from 'lucide-react';
import { modKey } from '@/lib/platform';
import { prefetchRoute } from '@/lib/routePrefetch';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { OfflineIndicator } from './OfflineIndicator';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Lazy-load GlobalSearch — only needed when user opens it
const GlobalSearch = lazy(() => import('./GlobalSearch').then(m => ({ default: m.GlobalSearch })));

interface AppHeaderProps {
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  onOpenShortcuts?: () => void;
}

export const AppHeader = memo(function AppHeader({ searchOpen, onSearchOpenChange, onOpenShortcuts }: AppHeaderProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.org_name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IN';

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="flex items-center justify-between h-12 px-3 md:px-5 border-b border-border bg-card gap-2" role="banner" aria-label="Application header">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" aria-label="Open navigation menu">
                <Menu className="w-4 h-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56">
              <AppSidebar onNavigate={() => setSidebarOpen(false)} onOpenShortcuts={onOpenShortcuts} />
            </SheetContent>
          </Sheet>
        )}
        <button
          onClick={() => onSearchOpenChange(true)}
          className="relative flex-1 max-w-xs hidden sm:flex items-center gap-2 h-8 rounded-md bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          aria-label="Open search. Press Control+K"
        >
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-auto pointer-events-none hidden md:inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground" aria-hidden="true">
            <span>{modKey}</span>K
          </kbd>
        </button>
        {!isMobile && onOpenShortcuts && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onOpenShortcuts}>
                <Keyboard className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Keyboard shortcuts (?)</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5 shrink-0" role="toolbar" aria-label="Quick actions">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSearchOpenChange(true)} aria-label="Open search">
            <Search className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => navigate('/invoices/new')}
              onMouseEnter={() => prefetchRoute('/invoices/new')}
              size="sm"
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {!isMobile && <span>New Invoice</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New Invoice (N)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{isDark ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>
        
        <NotificationBell />
        <OfflineIndicator />
        
        {/* Profile */}
        <div className="pl-1.5 ml-1 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary">{initials}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.org_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/help">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Help & Docs
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Only mount GlobalSearch when opened */}
      {searchOpen && (
        <Suspense fallback={null}>
          <GlobalSearch open={searchOpen} onOpenChange={onSearchOpenChange} />
        </Suspense>
      )}
    </header>
  );
});
