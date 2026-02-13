import { useMemo } from 'react';
import { BarChart3, FileText, TrendingUp, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { Skeleton } from '@/components/ui/skeleton';
import { exportInvoicesToCSV } from '@/utils/csvExport';
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
      .filter((i) => {
        const d = new Date(i.date_issued);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((s, i) => s + Number(i.grand_total), 0);

    const lastMonthRevenue = paidInvoices
      .filter((i) => {
        const d = new Date(i.date_issued);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((s, i) => s + Number(i.grand_total), 0);

    const growth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // GST from paid invoices
    let cgst = 0, sgst = 0, igst = 0;
    paidInvoices.forEach((inv) => {
      // Approximate split: assume all intra-state for simplicity
      const tax = Number(inv.total_tax);
      cgst += tax / 2;
      sgst += tax / 2;
    });

    // Outstanding
    const totalOutstanding = finalizedInvoices.reduce(
      (s, i) => s + Number(i.grand_total), 0
    );
    const overdue = finalizedInvoices
      .filter((i) => i.date_due && new Date(i.date_due) < now)
      .reduce((s, i) => s + Number(i.grand_total), 0);

    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dueThisWeek = finalizedInvoices
      .filter((i) => {
        if (!i.date_due) return false;
        const due = new Date(i.date_due);
        return due >= now && due <= sevenDaysFromNow;
      })
      .reduce((s, i) => s + Number(i.grand_total), 0);

    // Monthly chart data (last 6 months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(thisYear, thisMonth - i, 1);
      const monthName = m.toLocaleString('en-IN', { month: 'short' });
      const revenue = paidInvoices
        .filter((inv) => {
          const d = new Date(inv.date_issued);
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
        })
        .reduce((s, inv) => s + Number(inv.grand_total), 0);
      chartData.push({ month: monthName, revenue });
    }

    return { thisMonthRevenue, lastMonthRevenue, growth, cgst, sgst, igst, totalOutstanding, overdue, dueThisWeek, chartData };
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Track your business performance and generate reports
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto"
          onClick={() => exportInvoicesToCSV(invoices)}
        >
          <Download className="w-4 h-4" />
          Export All to CSV
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Sales Report</CardTitle>
                <CardDescription>Revenue and sales analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-semibold">{formatINR(stats.thisMonthRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Month</span>
                <span className="font-semibold">{formatINR(stats.lastMonthRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Growth</span>
                <span className={`font-semibold ${stats.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <FileText className="w-5 h-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-lg">GST Summary</CardTitle>
                <CardDescription>Tax collected and payable</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST Collected</span>
                <span className="font-semibold">{formatINR(stats.cgst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST Collected</span>
                <span className="font-semibold">{formatINR(stats.sgst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGST Collected</span>
                <span className="font-semibold">{formatINR(stats.igst)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-lg">Outstanding</CardTitle>
                <CardDescription>Pending payments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Outstanding</span>
                <span className="font-semibold text-warning">{formatINR(stats.totalOutstanding)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-semibold text-destructive">{formatINR(stats.overdue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due This Week</span>
                <span className="font-semibold">{formatINR(stats.dueThisWeek)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trend over the last 6 months</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats.chartData.every((d) => d.revenue === 0) ? (
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Charts will populate as you create and finalize invoices</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [formatINR(value), 'Revenue']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
