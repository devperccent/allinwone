import { useMemo } from 'react';
import { BarChart3, FileText, TrendingUp, Calendar, Download, Receipt, Wallet, LineChart, Users, FileJson } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { Skeleton } from '@/components/ui/skeleton';
import { exportInvoicesToCSV } from '@/utils/csvExport';
import { GSTReport } from '@/components/reports/GSTReport';
import { ProfitLossReport } from '@/components/reports/ProfitLossReport';
import { GSTR3BExport } from '@/components/reports/GSTR3BExport';
import { TDSManagement } from '@/components/reports/TDSManagement';
import { CashFlowForecast } from '@/components/reports/CashFlowForecast';
import { PartyLedger } from '@/components/reports/PartyLedger';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Track your business performance, GST liability, and outstanding payments
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => exportInvoicesToCSV(invoices)}>
          <Download className="w-4 h-4" /> Export All to CSV
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
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number, name: string) => [formatINR(value), name === 'revenue' ? 'Revenue' : 'Tax']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="revenue" />
                    <Bar dataKey="tax" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} name="tax" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ P&L TAB ═══ */}
        <TabsContent value="pnl"><ProfitLossReport /></TabsContent>

        {/* ═══ GST TAB ═══ */}
        <TabsContent value="gst"><GSTReport invoices={invoices} /></TabsContent>

        {/* ═══ GSTR-3B TAB ═══ */}
        <TabsContent value="gstr3b"><GSTR3BExport /></TabsContent>

        {/* ═══ TDS TAB ═══ */}
        <TabsContent value="tds"><TDSManagement /></TabsContent>

        {/* ═══ CASH FLOW TAB ═══ */}
        <TabsContent value="cashflow"><CashFlowForecast /></TabsContent>

        {/* ═══ LEDGER TAB ═══ */}
        <TabsContent value="ledger"><PartyLedger /></TabsContent>

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
