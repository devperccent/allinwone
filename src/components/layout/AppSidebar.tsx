import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Settings,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Keyboard,
  BookOpen,
  Zap,
  FileCheck,
  Truck,
  ClipboardList,
  RefreshCw,
  Receipt,
  Upload,
} from 'lucide-react';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useEnabledModules, type ModuleKey } from '@/hooks/useEnabledModules';
import inwLogo from '@/assets/inw-logomark.png';
import { ThemeLogo } from '@/components/ThemeLogo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { modKey } from '@/lib/platform';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  shortcut: string;
  module?: ModuleKey;
}

const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, shortcut: 'D' },
  { name: 'Quick Bill', href: '/quick-bill', icon: Zap, shortcut: '', module: 'quick_bill' },
  { name: 'Invoices', href: '/invoices', icon: FileText, shortcut: 'I' },
  { name: 'Quotations', href: '/quotations', icon: FileCheck, shortcut: 'Q', module: 'quotations' },
];

const documentNavigation: NavItem[] = [
  { name: 'Challans', href: '/challans', icon: Truck, shortcut: 'L', module: 'challans' },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ClipboardList, shortcut: 'O', module: 'purchase_orders' },
  { name: 'Purchase Bills', href: '/purchase-bills', icon: Receipt, shortcut: 'B', module: 'purchase_orders' },
  { name: 'Recurring', href: '/recurring', icon: RefreshCw, shortcut: 'U', module: 'recurring' },
];

const managementNavigation: NavItem[] = [
  { name: 'Products', href: '/products', icon: Package, shortcut: 'P' },
  { name: 'Clients', href: '/clients', icon: Users, shortcut: 'C' },
  { name: 'Reports', href: '/reports', icon: TrendingUp, shortcut: 'R', module: 'reports' },
  { name: 'Data Manager', href: '/bulk', icon: Upload, shortcut: 'E' },
];

const bottomNavigation: NavItem[] = [];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { isModuleEnabled } = useEnabledModules();

  const filterNav = (items: NavItem[]) =>
    items.filter(i => !i.module || isModuleEnabled(i.module));

  // On mobile (used inside Sheet), always show expanded
  const isCollapsed = isMobile ? false : collapsed;

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

  const renderNavItem = (item: typeof mainNavigation[0]) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href));
    
    const linkContent = (
      <Link
        key={item.name}
        to={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
        )}
      >
        <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.shortcut && !isMobile && (
              <span className="flex items-center gap-0.5">
                <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-sidebar-accent/60 px-1 font-mono text-[10px] font-medium text-sidebar-foreground/50">
                  {modKey}
                </kbd>
                <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-sidebar-accent/60 px-1 font-mono text-[10px] font-medium text-sidebar-foreground/50">
                  ⇧
                </kbd>
                <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-sidebar-accent/60 px-1 font-mono text-[10px] font-medium text-sidebar-foreground/50">
                  {item.shortcut}
                </kbd>
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>{item.name}</span>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.name}>{linkContent}</div>;
  };

  const renderSectionLabel = (label: string) => {
    if (isCollapsed) return <Separator className="my-2" />;
    return (
      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
        {label}
      </p>
    );
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          {isCollapsed ? (
            <img src={inwLogo} alt="Inw" className="w-10 h-10 object-contain" />
          ) : (
            <ThemeLogo className="h-8 object-contain" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {renderSectionLabel('Billing')}
        {filterNav(mainNavigation).map(renderNavItem)}

        {filterNav(documentNavigation).length > 0 && renderSectionLabel('Documents')}
        {filterNav(documentNavigation).map(renderNavItem)}

        {renderSectionLabel('Manage')}
        {filterNav(managementNavigation).map(renderNavItem)}
      </nav>

      {/* Keyboard shortcut hint */}
      {!isCollapsed && (
        <div className="px-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-sidebar-foreground/40">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Press <kbd className="font-mono font-medium">?</kbd> for all shortcuts</span>
          </div>
        </div>
      )}

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 ring-2 ring-primary/20 group-hover:ring-primary/40 flex items-center justify-center flex-shrink-0 transition-all">
                <span className="text-xs font-semibold text-primary">{initials}</span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left truncate">
                  <p className="truncate text-xs">{profile?.org_name || 'Loading...'}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">Settings & more ▾</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.org_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" onClick={onNavigate}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help" onClick={onNavigate}>
                <BookOpen className="w-4 h-4 mr-2" />
                Help & Docs
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/admin" onClick={onNavigate}>
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

        {/* Collapse button - hide on mobile */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50',
              isCollapsed && 'justify-center'
            )}
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', isCollapsed && 'rotate-180')} />
            {!isCollapsed && <span>Collapse</span>}
          </Button>
        )}
      </div>
    </aside>
  );
}
