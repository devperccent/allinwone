import {
  IndianRupee,
  Clock,
  FileText,
  AlertTriangle,
  Users,
  Package,
  Plus,
} from 'lucide-react';
import { modKey } from '@/lib/platform';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  const { quotations, isLoading: quotationsLoading } = useQuotations();
  const { challans, isLoading: challansLoading } = useDeliveryChallans();
  const { purchaseOrders, isLoading: posLoading } = usePurchaseOrders();
  const { isModuleEnabled } = useEnabledModules();
  const isLoading = invoicesLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Here's what's happening with your business today.
          </p>
        </div>
        <Button asChild className="gap-2 w-full sm:w-auto">
          <Link to="/invoices/new">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatINR(totalRevenue)}
          change={invoices.filter(i => i.status === 'paid').length + ' paid invoices'}
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-success"
        />
        <StatCard
          title="Pending Amount"
          value={formatINR(pendingAmount)}
          change={invoices.filter(i => i.status === 'finalized').length + ' invoices unpaid'}
          changeType="neutral"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Total Invoices"
          value={String(invoices.length)}
          change={invoices.filter(i => i.status === 'draft').length + ' drafts'}
          changeType="neutral"
          icon={FileText}
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockProducts.length)}
          change={lowStockProducts.length > 0 ? 'Needs attention' : 'All stocked'}
          changeType={lowStockProducts.length > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          iconColor={lowStockProducts.length > 0 ? 'text-destructive' : 'text-success'}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/invoices/new"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">New Invoice</p>
            <p className="text-sm text-muted-foreground">Create a new invoice</p>
          </div>
          <kbd className="hidden sm:inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">N</kbd>
        </Link>
        
        <Link
          to="/products"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Add Product</p>
            <p className="text-sm text-muted-foreground">Add to inventory</p>
          </div>
          <div className="hidden sm:flex items-center gap-0.5">
            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">{modKey}</kbd>
            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">⇧</kbd>
            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">P</kbd>
          </div>
        </Link>
        
        <Link
          to="/clients"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Add Client</p>
            <p className="text-sm text-muted-foreground">Add a new client</p>
          </div>
          <div className="hidden sm:flex items-center gap-0.5">
            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">{modKey}</kbd>
            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">⇧</kbd>
            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">C</kbd>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RecentInvoices invoices={invoices.slice(0, 5)} />
          {(isModuleEnabled('quotations') || isModuleEnabled('purchase_orders')) && (
            <div className="grid gap-6 sm:grid-cols-2">
              {isModuleEnabled('quotations') && <RecentQuotations quotations={quotations.slice(0, 4)} />}
              {isModuleEnabled('purchase_orders') && <RecentPurchaseOrders purchaseOrders={purchaseOrders.slice(0, 4)} />}
            </div>
          )}
          {isModuleEnabled('challans') && <RecentChallans challans={challans.slice(0, 4)} />}
          <ActivityFeed />
        </div>
        <div className="space-y-6">
          <LowStockAlert products={lowStockProducts} />
        </div>
      </div>
    </div>
  );
}
