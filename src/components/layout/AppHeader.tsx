import { Bell, Search, Plus, Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';

export function AppHeader() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const initials = profile?.org_name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IN';

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6 border-b border-border bg-card gap-2">
      {/* Mobile menu + Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AppSidebar />
            </SheetContent>
          </Sheet>
        )}
        <div className="relative flex-1 max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices, clients..."
            className="pl-10 bg-muted/30 border-transparent focus:border-primary focus:bg-background"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <Button
          onClick={() => navigate('/invoices/new')}
          size={isMobile ? 'icon' : 'default'}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {!isMobile && 'New Invoice'}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        
        {!isMobile && (
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{initials}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
