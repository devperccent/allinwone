import { useMemo, lazy, Suspense } from 'react';
import { BarChart3, FileText, TrendingUp, Calendar, Download, Receipt, Wallet, LineChart, Users, FileJson } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { Skeleton } from '@/components/ui/skeleton';
import { exportInvoicesToCSV } from '@/utils/csvExport';

// Lazy-load heavy report sub-components
const GSTReport = lazy(() => import('@/components/reports/GSTReport').then(m => ({ default: m.GSTReport })));
const ProfitLossReport = lazy(() => import('@/components/reports/ProfitLossReport').then(m => ({ default: m.ProfitLossReport })));
const GSTR3BExport = lazy(() => import('@/components/reports/GSTR3BExport').then(m => ({ default: m.GSTR3BExport })));
const TDSManagement = lazy(() => import('@/components/reports/TDSManagement').then(m => ({ default: m.TDSManagement })));
const CashFlowForecast = lazy(() => import('@/components/reports/CashFlowForecast').then(m => ({ default: m.CashFlowForecast })));
const PartyLedger = lazy(() => import('@/components/reports/PartyLedger').then(m => ({ default: m.PartyLedger })));

// Lazy-load recharts (heavy library)
const RechartsChart = lazy(() => import('recharts').then(m => ({
  default: ({ data }: { data: any[] }) => (
    <m.ResponsiveContainer width="100%" height={300}>
      <m.BarChart data={data}>
        <m.CartesianGrid strokeDasharray="3 3" />
        <m.XAxis dataKey="month" />
        <m.YAxis />
        <m.Tooltip formatter={(value: number) => formatINR(value)} />
        <m.Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </m.BarChart>
    </m.ResponsiveContainer>
  )
})));

export default function ReportsPage() {
  const { invoices, isLoading } = useInvoices();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const finalizedInvoices = invoices.filter((i) => i.status === 'finalized');

    const thisMonthRevenue = paidInvoices
      .filter((i) => { const d = new Date(i.date_issued); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
      .reduce((s, i) => s + Number(i.grand_total), 0);

    const lastMonthRevenue = paidInvoices
      .filter((i) => { const d = new Date(i.date_issued); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; })
      .reduce((s, i) => s + Number(i.grand_total), 0);

    const growth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    const totalOutstanding = finalizedInvoices.reduce((s, i) => s + Number(i.grand_total), 0);
    const overdue = finalizedInvoices
      .filter((i) => i.date_due && new Date(i.date_due) < now)
      .reduce((s, i) => s + Number(i.grand_total), 0);

    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dueThisWeek = finalizedInvoices
      .filter((i) => { if (!i.date_due) return false; const due = new Date(i.date_due); return due >= now && due <= sevenDaysFromNow; })
      .reduce((s, i) => s + Number(i.grand_total), 0);

    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(thisYear, thisMonth - i, 1);
      const monthName = m.toLocaleString('en-IN', { month: 'short' });
      const revenue = paidInvoices
        .filter((inv) => { const d = new Date(inv.date_issued); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); })
        .reduce((s, inv) => s + Number(inv.grand_total), 0);
      const tax = paidInvoices
        .filter((inv) => { const d = new Date(inv.date_issued); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); })
        .reduce((s, inv) => s + Number(inv.total_tax), 0);
      chartData.push({ month: monthName, revenue, tax });
    }

    return { thisMonthRevenue, lastMonthRevenue, growth, totalOutstanding, overdue, dueThisWeek, chartData };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Reports</h1>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground" onClick={() => exportInvoicesToCSV(invoices)}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-muted/50 w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="sales" className="gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="pnl" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="w-3.5 h-3.5" /><span className="hidden sm:inline">P&L</span>
          </TabsTrigger>
          <TabsTrigger value="gst" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="w-3.5 h-3.5" /><span className="hidden sm:inline">GST</span>
          </TabsTrigger>
          <TabsTrigger value="gstr3b" className="gap-1.5 text-xs sm:text-sm">
            <FileJson className="w-3.5 h-3.5" /><span className="hidden sm:inline">GSTR-3B</span>
          </TabsTrigger>
          <TabsTrigger value="tds" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">TDS</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-1.5 text-xs sm:text-sm">
            <LineChart className="w-3.5 h-3.5" /><span className="hidden sm:inline">Cash Flow</span>
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-3.5 h-3.5" /><span className="hidden sm:inline">Ledger</span>
          </TabsTrigger>
          <TabsTrigger value="outstanding" className="gap-1.5 text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5" /><span className="hidden sm:inline">Outstanding</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══ SALES TAB ═══ */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="w-5 h-5 text-primary" /></div>
                  <div><CardTitle className="text-lg">This Month</CardTitle><CardDescription>Revenue collected</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatINR(stats.thisMonthRevenue)}</p>
                <p className={`text-sm mt-1 ${stats.growth >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}% vs last month
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><BarChart3 className="w-5 h-5 text-muted-foreground" /></div>
                  <div><CardTitle className="text-lg">Last Month</CardTitle><CardDescription>Revenue collected</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatINR(stats.lastMonthRevenue)}</p></CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-5 h-5 text-primary" /></div>
                  <div><CardTitle className="text-lg">Total Invoices</CardTitle><CardDescription>All time</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-muted-foreground mt-1">{invoices.filter((i) => i.status === 'paid').length} paid</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div><CardTitle>Monthly Revenue & Tax</CardTitle><CardDescription>Last 6 months</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              {stats.chartData.every((d) => d.revenue === 0) ? (
                <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                  <div className="text-center text-muted-foreground"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Charts will populate as you create and finalize invoices</p></div>
                </div>
              ) : (
                <Suspense fallback={<div className="h-[280px] flex items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
                  <RechartsChart data={stats.chartData} />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ P&L TAB ═══ */}
        <TabsContent value="pnl"><Suspense fallback={<Skeleton className="h-64 w-full" />}><ProfitLossReport /></Suspense></TabsContent>

        {/* ═══ GST TAB ═══ */}
        <TabsContent value="gst"><Suspense fallback={<Skeleton className="h-64 w-full" />}><GSTReport invoices={invoices} /></Suspense></TabsContent>

        {/* ═══ GSTR-3B TAB ═══ */}
        <TabsContent value="gstr3b"><Suspense fallback={<Skeleton className="h-64 w-full" />}><GSTR3BExport /></Suspense></TabsContent>

        {/* ═══ TDS TAB ═══ */}
        <TabsContent value="tds"><Suspense fallback={<Skeleton className="h-64 w-full" />}><TDSManagement /></Suspense></TabsContent>

        {/* ═══ CASH FLOW TAB ═══ */}
        <TabsContent value="cashflow"><Suspense fallback={<Skeleton className="h-64 w-full" />}><CashFlowForecast /></Suspense></TabsContent>

        {/* ═══ LEDGER TAB ═══ */}
        <TabsContent value="ledger"><Suspense fallback={<Skeleton className="h-64 w-full" />}><PartyLedger /></Suspense></TabsContent>

        {/* ═══ OUTSTANDING TAB ═══ */}
        <TabsContent value="outstanding" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10"><Calendar className="w-5 h-5 text-amber-500" /></div>
                  <div><CardTitle className="text-lg">Total Outstanding</CardTitle><CardDescription>Unpaid finalized invoices</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold text-amber-600">{formatINR(stats.totalOutstanding)}</p></CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10"><Calendar className="w-5 h-5 text-destructive" /></div>
                  <div><CardTitle className="text-lg">Overdue</CardTitle><CardDescription>Past due date</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold text-destructive">{formatINR(stats.overdue)}</p></CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div>
                  <div><CardTitle className="text-lg">Due This Week</CardTitle><CardDescription>Coming up in 7 days</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatINR(stats.dueThisWeek)}</p></CardContent>
            </Card>
          </div>

          {invoices.filter((i) => i.status === 'finalized' && i.date_due && new Date(i.date_due) < new Date()).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overdue Invoices</CardTitle>
                <CardDescription>These invoices are past their due date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices
                    .filter((i) => i.status === 'finalized' && i.date_due && new Date(i.date_due) < new Date())
                    .sort((a, b) => new Date(a.date_due!).getTime() - new Date(b.date_due!).getTime())
                    .map((inv) => {
                      const daysOverdue = Math.ceil((new Date().getTime() - new Date(inv.date_due!).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                          <div>
                            <p className="font-medium text-sm">{inv.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">{inv.client?.name || 'Walk-in'} · {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</p>
                          </div>
                          <p className="font-semibold text-destructive tabular-nums">{formatINR(Number(inv.grand_total))}</p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
