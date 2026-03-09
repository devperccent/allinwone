import {
  IndianRupee,
  Clock,
  FileText,
  AlertTriangle,
  Users,
  Package,
  Plus,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { RecentQuotations } from '@/components/dashboard/RecentQuotations';
import { RecentChallans } from '@/components/dashboard/RecentChallans';
import { RecentPurchaseOrders } from '@/components/dashboard/RecentPurchaseOrders';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { ExpiringBatchesAlert } from '@/components/dashboard/ExpiringBatchesAlert';
import { LowStockAutoPO } from '@/components/dashboard/LowStockAutoPO';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { AnnouncementBanner } from '@/components/dashboard/AnnouncementBanner';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { useProducts } from '@/hooks/useProducts';
import { useQuotations } from '@/hooks/useQuotations';
import { useDeliveryChallans } from '@/hooks/useDeliveryChallans';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { invoices, totalRevenue, pendingAmount, isLoading: invoicesLoading } = useInvoices();
  const { products, lowStockProducts, isLoading: productsLoading } = useProducts();
  const { quotations } = useQuotations();
  const { challans } = useDeliveryChallans();
  const { purchaseOrders } = usePurchaseOrders();
  const { isModuleEnabled } = useEnabledModules();
  const isLoading = invoicesLoading || productsLoading;

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

  const hasDocModules = isModuleEnabled('quotations') || isModuleEnabled('challans') || isModuleEnabled('purchase_orders');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
          <Link to="/invoices/new">
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatINR(totalRevenue)}
          change={invoices.filter(i => i.status === 'paid').length + ' paid'}
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-success"
        />
        <StatCard
          title="Pending"
          value={formatINR(pendingAmount)}
          change={invoices.filter(i => i.status === 'finalized').length + ' unpaid'}
          changeType="neutral"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Invoices"
          value={String(invoices.length)}
          change={invoices.filter(i => i.status === 'draft').length + ' drafts'}
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

      {/* Tabbed content */}
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
          <RecentInvoices invoices={invoices.slice(0, 5)} />
        </TabsContent>

        {hasDocModules && (
          <TabsContent value="documents" className="space-y-4">
            {isModuleEnabled('quotations') && (
              <RecentQuotations quotations={quotations.slice(0, 5)} />
            )}
            {isModuleEnabled('purchase_orders') && (
              <RecentPurchaseOrders purchaseOrders={purchaseOrders.slice(0, 5)} />
            )}
            {isModuleEnabled('challans') && (
              <RecentChallans challans={challans.slice(0, 5)} />
            )}
          </TabsContent>
        )}

        <TabsContent value="activity">
          <ActivityFeed />
        </TabsContent>

        {lowStockProducts.length > 0 && (
          <TabsContent value="alerts" className="space-y-4">
            <LowStockAlert products={lowStockProducts} />
            <LowStockAutoPO />
            <ExpiringBatchesAlert />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
