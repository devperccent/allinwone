import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SidebarKeyboardHint } from '@/components/onboarding/KeyboardShortcutsHint';
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
  BookOpen,
  Zap,
  FileCheck,
  Truck,
  ClipboardList,
  RefreshCw,
  Receipt,
  Upload,
  CreditCard,
} from 'lucide-react';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useEnabledModules, type ModuleKey } from '@/hooks/useEnabledModules';
import inwLogo from '@/assets/inw-logomark.png';
import { ThemeLogo } from '@/components/ThemeLogo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useCallback } from 'react';
import { prefetchRoute } from '@/lib/routePrefetch';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations/en';
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
  nameKey: TranslationKey;
  href: string;
  icon: any;
  module?: ModuleKey;
}

const mainNavigation: NavItem[] = [
  { nameKey: 'nav_dashboard', href: '/', icon: LayoutDashboard },
  { nameKey: 'nav_quickBill', href: '/quick-bill', icon: Zap, module: 'quick_bill' },
  { nameKey: 'nav_invoices', href: '/invoices', icon: FileText },
  { nameKey: 'nav_quotations', href: '/quotations', icon: FileCheck, module: 'quotations' },
];

const documentNavigation: NavItem[] = [
  { nameKey: 'nav_challans', href: '/challans', icon: Truck, module: 'challans' },
  { nameKey: 'nav_purchaseOrders', href: '/purchase-orders', icon: ClipboardList, module: 'purchase_orders' },
  { nameKey: 'nav_purchaseBills', href: '/purchase-bills', icon: Receipt, module: 'purchase_orders' },
  { nameKey: 'nav_recurring', href: '/recurring', icon: RefreshCw, module: 'recurring' },
];

const managementNavigation: NavItem[] = [
  { nameKey: 'nav_products', href: '/products', icon: Package },
  { nameKey: 'nav_clients', href: '/clients', icon: Users },
  { nameKey: 'nav_reports', href: '/reports', icon: TrendingUp, module: 'reports' },
  { nameKey: 'nav_dataManager', href: '/bulk', icon: Upload },
  { nameKey: 'nav_billing', href: '/billing', icon: CreditCard },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  onOpenShortcuts?: () => void;
}

export function AppSidebar({ onNavigate, onOpenShortcuts }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { isModuleEnabled } = useEnabledModules();
  const { t } = useLanguage();

  const filteredMain = useMemo(() => mainNavigation.filter(i => !i.module || isModuleEnabled(i.module)), [isModuleEnabled]);
  const filteredDocs = useMemo(() => documentNavigation.filter(i => !i.module || isModuleEnabled(i.module)), [isModuleEnabled]);
  const filteredMgmt = useMemo(() => managementNavigation.filter(i => !i.module || isModuleEnabled(i.module)), [isModuleEnabled]);

  const isCollapsed = isMobile ? false : collapsed;

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  const initials = profile?.org_name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IN';

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href));
    const name = t(item.nameKey);
    
    const linkContent = (
      <Link
        key={item.nameKey}
        to={item.href}
        onClick={onNavigate}
        onMouseEnter={() => prefetchRoute(item.href)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
      >
        <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive && 'text-primary')} />
        {!isCollapsed && <span className="flex-1">{name}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.nameKey}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.nameKey}>{linkContent}</div>;
  };

  const renderSectionLabel = (labelKey: TranslationKey) => {
    if (isCollapsed) return <Separator className="my-2" />;
    return (
      <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
        {t(labelKey)}
      </p>
    );
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-[60px]' : 'w-56'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center h-12 px-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center">
          {isCollapsed ? (
            <img src={inwLogo} alt="Inw" className="w-6 h-6 object-contain" />
          ) : (
            <ThemeLogo className="h-[22px] object-contain" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto" aria-label="Sidebar menu">
        {renderSectionLabel('section_billing')}
        {filteredMain.map(renderNavItem)}

        {filteredDocs.length > 0 && renderSectionLabel('section_documents')}
        {filteredDocs.map(renderNavItem)}

        {renderSectionLabel('section_manage')}
        {filteredMgmt.map(renderNavItem)}
      </nav>

      {/* Keyboard hints */}
      {onOpenShortcuts && (
        <SidebarKeyboardHint onOpenShortcuts={onOpenShortcuts} collapsed={isCollapsed} />
      )}

      {/* User section */}
      <div className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors',
                'text-sidebar-foreground hover:bg-sidebar-accent/50',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-semibold text-primary">{initials}</span>
              </div>
              {!isCollapsed && (
                <span className="flex-1 text-left text-xs truncate">{profile?.org_name || t('loading')}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.org_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" onClick={onNavigate}>
                <Settings className="w-4 h-4 mr-2" />
                {t('nav_settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help" onClick={onNavigate}>
                <BookOpen className="w-4 h-4 mr-2" />
                {t('nav_helpDocs')}
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/admin" onClick={onNavigate}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {t('nav_adminPanel')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              {t('nav_signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse button */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full justify-start gap-2.5 mt-1 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50',
              isCollapsed && 'justify-center'
            )}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')} />
            {!isCollapsed && <span className="text-xs">{t('nav_collapse')}</span>}
          </Button>
        )}
      </div>
    </aside>
  );
}
