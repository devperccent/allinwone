import { useMemo, lazy, Suspense } from 'react';
import {
  IndianRupee,
  Clock,
  FileText,
  AlertTriangle,
  Plus,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { AnnouncementBanner } from '@/components/dashboard/AnnouncementBanner';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { useProducts } from '@/hooks/useProducts';
import { useQuotations } from '@/hooks/useQuotations';
import { useDeliveryChallans } from '@/hooks/useDeliveryChallans';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load tab content that isn't visible on initial render
const RecentQuotations = lazy(() => import('@/components/dashboard/RecentQuotations').then(m => ({ default: m.RecentQuotations })));
const RecentChallans = lazy(() => import('@/components/dashboard/RecentChallans').then(m => ({ default: m.RecentChallans })));
const RecentPurchaseOrders = lazy(() => import('@/components/dashboard/RecentPurchaseOrders').then(m => ({ default: m.RecentPurchaseOrders })));
const LowStockAlert = lazy(() => import('@/components/dashboard/LowStockAlert').then(m => ({ default: m.LowStockAlert })));
const ExpiringBatchesAlert = lazy(() => import('@/components/dashboard/ExpiringBatchesAlert').then(m => ({ default: m.ExpiringBatchesAlert })));
const LowStockAutoPO = lazy(() => import('@/components/dashboard/LowStockAutoPO').then(m => ({ default: m.LowStockAutoPO })));
const ActivityFeed = lazy(() => import('@/components/dashboard/ActivityFeed').then(m => ({ default: m.ActivityFeed })));

export default function Dashboard() {
  const { invoices, totalRevenue, pendingAmount, isLoading: invoicesLoading } = useInvoices();
  const { lowStockProducts, isLoading: productsLoading } = useProducts();
  const { quotations } = useQuotations();
  const { challans } = useDeliveryChallans();
  const { purchaseOrders } = usePurchaseOrders();
  const { isModuleEnabled } = useEnabledModules();
  const isLoading = invoicesLoading || productsLoading;

  // Memoize status counts — avoids 3 separate filter passes per render
  const stats = useMemo(() => {
    let paid = 0, finalized = 0, drafts = 0;
    for (const inv of invoices) {
      if (inv.status === 'paid') paid++;
      else if (inv.status === 'finalized') finalized++;
      else if (inv.status === 'draft') drafts++;
    }
    return { paid, finalized, drafts };
  }, [invoices]);

  // Memoize sliced arrays to prevent re-creating on every render
  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);
  const recentQuotations = useMemo(() => quotations.slice(0, 5), [quotations]);
  const recentChallans = useMemo(() => challans.slice(0, 5), [challans]);
  const recentPOs = useMemo(() => purchaseOrders.slice(0, 5), [purchaseOrders]);

  const hasDocModules = isModuleEnabled('quotations') || isModuleEnabled('challans') || isModuleEnabled('purchase_orders');

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <AnnouncementBanner />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
          <Link to="/invoices/new">
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatINR(totalRevenue)}
          change={stats.paid + ' paid'}
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-success"
        />
        <StatCard
          title="Pending"
          value={formatINR(pendingAmount)}
          change={stats.finalized + ' unpaid'}
          changeType="neutral"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Invoices"
          value={String(invoices.length)}
          change={stats.drafts + ' drafts'}
          changeType="neutral"
          icon={FileText}
        />
        <StatCard
          title="Low Stock"
          value={String(lowStockProducts.length)}
          change={lowStockProducts.length > 0 ? 'Needs attention' : 'All good'}
          changeType={lowStockProducts.length > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          iconColor={lowStockProducts.length > 0 ? 'text-destructive' : 'text-success'}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 h-9">
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Overview
          </TabsTrigger>
          {hasDocModules && (
            <TabsTrigger value="documents" className="text-xs gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Documents
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="text-xs gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Activity
          </TabsTrigger>
          {lowStockProducts.length > 0 && (
            <TabsTrigger value="alerts" className="text-xs gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Alerts
              <span className="ml-0.5 text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 leading-4">
                {lowStockProducts.length}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <RecentInvoices invoices={recentInvoices} />
        </TabsContent>

        {hasDocModules && (
          <TabsContent value="documents" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-40" />}>
              {isModuleEnabled('quotations') && (
                <RecentQuotations quotations={recentQuotations} />
              )}
              {isModuleEnabled('purchase_orders') && (
                <RecentPurchaseOrders purchaseOrders={recentPOs} />
              )}
              {isModuleEnabled('challans') && (
                <RecentChallans challans={recentChallans} />
              )}
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="activity">
          <Suspense fallback={<Skeleton className="h-40" />}>
            <ActivityFeed />
          </Suspense>
        </TabsContent>

        {lowStockProducts.length > 0 && (
          <TabsContent value="alerts" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-40" />}>
              <LowStockAlert products={lowStockProducts} />
              <LowStockAutoPO />
              <ExpiringBatchesAlert />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
