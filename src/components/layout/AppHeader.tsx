import { Bell, Search, Plus, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export function AppHeader() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();

  const initials = profile?.org_name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IN';

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search invoices, clients, products..."
          className="pl-10 bg-muted/30 border-transparent focus:border-primary focus:bg-background"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => navigate('/invoices/new')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Invoice
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
        
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
