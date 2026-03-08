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
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
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
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const hasDocModules = isModuleEnabled('quotations') || isModuleEnabled('challans') || isModuleEnabled('purchase_orders');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your business at a glance</p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link to="/invoices/new">
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats - always visible */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
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

      {/* Tabbed content area */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 w-full sm:w-auto overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="overview" className="gap-1.5 shrink-0">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          {hasDocModules && (
            <TabsTrigger value="documents" className="gap-1.5 shrink-0">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
          {lowStockProducts.length > 0 && (
            <TabsTrigger value="alerts" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Alerts
              <span className="ml-1 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
                {lowStockProducts.length}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/invoices/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">New Invoice</p>
                <p className="text-xs text-muted-foreground">Create invoice</p>
              </div>
            </Link>
            <Link
              to="/products"
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Add Product</p>
                <p className="text-xs text-muted-foreground">Add to inventory</p>
              </div>
            </Link>
            <Link
              to="/clients"
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Add Client</p>
                <p className="text-xs text-muted-foreground">New client</p>
              </div>
            </Link>
          </div>

          {/* Recent invoices only */}
          <RecentInvoices invoices={invoices.slice(0, 5)} />
        </TabsContent>

        {hasDocModules && (
          <TabsContent value="documents" className="space-y-6">
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
          <TabsContent value="alerts">
            <LowStockAlert products={lowStockProducts} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
