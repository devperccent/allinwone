import { useAuth } from '@/contexts/AuthContext';

export const ALL_MODULES = [
  { key: 'quick_bill', label: 'Quick Bill (POS)', description: 'Retail point-of-sale checkout flow' },
  { key: 'quotations', label: 'Quotations', description: 'Create and send quotations, convert to invoices' },
  { key: 'challans', label: 'Delivery Challans', description: 'Track goods dispatched with transport details' },
  { key: 'purchase_orders', label: 'Purchase Orders', description: 'Create purchase orders for suppliers' },
  { key: 'recurring', label: 'Recurring Invoices', description: 'Auto-generate invoices on a schedule' },
  { key: 'reports', label: 'Reports & Analytics', description: 'GST reports, revenue charts, and CSV exports' },
] as const;

export type ModuleKey = typeof ALL_MODULES[number]['key'];

const MODULE_ROUTES: Record<ModuleKey, string[]> = {
  quick_bill: ['/quick-bill'],
  quotations: ['/quotations'],
  challans: ['/challans'],
  purchase_orders: ['/purchase-orders'],
  recurring: ['/recurring'],
  reports: ['/reports'],
};

export function useEnabledModules() {
  const { profile } = useAuth();

  const enabledModules: ModuleKey[] = (profile as any)?.enabled_modules ?? 
    ALL_MODULES.map(m => m.key);

  const isModuleEnabled = (key: ModuleKey): boolean => {
    return enabledModules.includes(key);
  };

  const isRouteEnabled = (path: string): boolean => {
    for (const [moduleKey, routes] of Object.entries(MODULE_ROUTES)) {
      if (routes.some(r => path.startsWith(r))) {
        return isModuleEnabled(moduleKey as ModuleKey);
      }
    }
    return true; // Core routes always enabled
  };

  return { enabledModules, isModuleEnabled, isRouteEnabled };
}
