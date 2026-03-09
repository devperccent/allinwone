// Route chunk prefetch map — matches lazy() imports in App.tsx
const routeChunkMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/Dashboard'),
  '/quick-bill': () => import('@/pages/QuickBillPage'),
  '/invoices': () => import('@/pages/InvoicesPage'),
  '/invoices/new': () => import('@/pages/InvoiceEditor'),
  '/quotations': () => import('@/pages/QuotationsPage'),
  '/quotations/new': () => import('@/pages/QuotationEditor'),
  '/challans': () => import('@/pages/DeliveryChallansPage'),
  '/challans/new': () => import('@/pages/ChallanEditor'),
  '/purchase-orders': () => import('@/pages/PurchaseOrdersPage'),
  '/purchase-orders/new': () => import('@/pages/PurchaseOrderEditor'),
  '/purchase-bills': () => import('@/pages/PurchaseBillsPage'),
  '/purchase-bills/new': () => import('@/pages/PurchaseBillEditor'),
  '/recurring': () => import('@/pages/RecurringInvoicesPage'),
  '/products': () => import('@/pages/ProductsPage'),
  '/clients': () => import('@/pages/ClientsPage'),
  '/reports': () => import('@/pages/ReportsPage'),
  '/settings': () => import('@/pages/SettingsPage'),
  '/help': () => import('@/pages/HelpPage'),
  '/bulk': () => import('@/pages/BulkImportExportPage'),
  '/billing': () => import('@/pages/BillingPage'),
  '/admin': () => import('@/pages/admin/AdminDashboard'),
};

const prefetched = new Set<string>();

export function prefetchRoute(href: string) {
  if (prefetched.has(href)) return;
  const loader = routeChunkMap[href];
  if (loader) {
    prefetched.add(href);
    loader();
  }
}
