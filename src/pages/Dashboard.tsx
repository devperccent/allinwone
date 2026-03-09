import { useMemo, lazy, Suspense } from 'react';
import {
  IndianRupee,
  Clock,
  FileText,
  AlertTriangle,
  Plus,
  TrendingUp,
  ArrowRight,
  HandCoins,
  Wallet,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { prefetchRoute } from '@/lib/routePrefetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { AnnouncementBanner } from '@/components/dashboard/AnnouncementBanner';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { useExpenses } from '@/hooks/useExpenses';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Client } from '@/types';

const LowStockAlert = lazy(() => import('@/components/dashboard/LowStockAlert').then(m => ({ default: m.LowStockAlert })));
const ActivityFeed = lazy(() => import('@/components/dashboard/ActivityFeed').then(m => ({ default: m.ActivityFeed })));

export default function Dashboard() {
  const { invoices, totalRevenue, pendingAmount, isLoading: invoicesLoading } = useInvoices();
  const { lowStockProducts, isLoading: productsLoading } = useProducts();
  const { clients } = useClients();
  const { monthlyTotals: expenseMonthly } = useExpenses();
  const { t } = useLanguage();
  const isLoading = invoicesLoading || productsLoading;

  // Stats
  const stats = useMemo(() => {
    let paid = 0, finalized = 0, drafts = 0;
    for (const inv of invoices) {
      if (inv.status === 'paid') paid++;
      else if (inv.status === 'finalized') finalized++;
      else if (inv.status === 'draft') drafts++;
    }
    return { paid, finalized, drafts };
  }, [invoices]);

  // Overdue invoices
  const overdueData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0, amount = 0;
    for (const inv of invoices) {
      if (inv.status === 'finalized' && inv.date_due) {
        const due = new Date(inv.date_due);
        if (due <= today) { count++; amount += Number(inv.grand_total); }
      }
    }
    return { count, amount };
  }, [invoices]);

  // Top debtors
  const topDebtors = useMemo(() => {
    const clientMap = new Map<string, { client: Client; total: number }>();
    for (const inv of invoices) {
      if (inv.status === 'finalized' && inv.client_id) {
        const existing = clientMap.get(inv.client_id);
        if (existing) {
          existing.total += Number(inv.grand_total);
        } else {
          const client = clients.find(c => c.id === inv.client_id);
          if (client) clientMap.set(inv.client_id, { client, total: Number(inv.grand_total) });
        }
      }
    }
    return [...clientMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [invoices, clients]);

  // This month's revenue
  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let total = 0;
    for (const inv of invoices) {
      if (inv.status === 'paid' && inv.payment_date?.startsWith(month)) {
        total += Number(inv.grand_total);
      }
    }
    return total;
  }, [invoices]);

  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <AnnouncementBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('dash_title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your business at a glance</p>
        </div>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs" onMouseEnter={() => prefetchRoute('/invoices/new')}>
          <Link to="/invoices/new">
            <Plus className="w-3.5 h-3.5" />
            {t('dash_newInvoice')}
          </Link>
        </Button>
      </div>

      {/* Key numbers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Collected This Month"
          value={formatINR(thisMonthRevenue)}
          change={stats.paid + ' ' + t('dash_paid')}
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-success"
        />
        <StatCard
          title={t('dash_pending')}
          value={formatINR(pendingAmount)}
          change={stats.finalized + ' ' + t('dash_unpaid')}
          changeType="neutral"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Overdue"
          value={formatINR(overdueData.amount)}
          change={overdueData.count > 0 ? `${overdueData.count} overdue` : 'None overdue'}
          changeType={overdueData.count > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          iconColor={overdueData.count > 0 ? 'text-destructive' : 'text-success'}
        />
        <StatCard
          title="Expenses This Month"
          value={formatINR(expenseMonthly.total)}
          change={`Net: ${formatINR(thisMonthRevenue - expenseMonthly.total)}`}
          changeType={thisMonthRevenue - expenseMonthly.total > 0 ? 'positive' : 'negative'}
          icon={Wallet}
        />
      </div>

      {/* Action cards row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Overdue action */}
        {overdueData.count > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    {overdueData.count} Overdue Payment{overdueData.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatINR(overdueData.amount)} needs collection
                  </p>
                </div>
                <Button variant="destructive" size="sm" className="text-xs h-8" asChild>
                  <Link to="/collections">
                    <HandCoins className="w-3.5 h-3.5 mr-1" />
                    Collect Now
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low stock */}
        {lowStockProducts.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-warning">
                    {lowStockProducts.length} Low Stock Item{lowStockProducts.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                    {lowStockProducts.length > 2 && ` +${lowStockProducts.length - 2} more`}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                  <Link to="/products">View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8" asChild onMouseEnter={() => prefetchRoute('/invoices/new')}>
                <Link to="/invoices/new">New Invoice</Link>
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                <Link to="/expenses">Add Expense</Link>
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                <Link to="/udhaar">View Udhaar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent invoices */}
        <div className="lg:col-span-3">
          <RecentInvoices invoices={recentInvoices} />
        </div>

        {/* Who owes you */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Who Owes You
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                  <Link to="/udhaar">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {topDebtors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-xs">No pending payments ✅</p>
                </div>
              ) : (
                <div className="divide-y">
                  {topDebtors.map(({ client, total }) => (
                    <div key={client.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm truncate flex-1">{client.name}</span>
                      <span className="text-sm font-semibold text-destructive">{formatINR(total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity feed */}
      <Suspense fallback={<Skeleton className="h-40" />}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
