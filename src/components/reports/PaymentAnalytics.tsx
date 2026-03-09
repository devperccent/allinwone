import { useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { useClients } from '@/hooks/useClients';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CreditCard, Clock, AlertTriangle } from 'lucide-react';

const RechartsComponents = lazy(() => import('recharts').then(m => ({
  default: ({ trendData, modeData }: { trendData: any[]; modeData: any[] }) => {
    const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <m.ResponsiveContainer width="100%" height={220}>
              <m.AreaChart data={trendData}>
                <m.CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <m.XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <m.YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <m.Tooltip formatter={(v: number) => [formatINR(v), 'Collected']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                <m.Area type="monotone" dataKey="collected" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                <m.Area type="monotone" dataKey="invoiced" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.08)" strokeWidth={1.5} strokeDasharray="4 4" />
              </m.AreaChart>
            </m.ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Mode Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <m.ResponsiveContainer width="100%" height={220}>
              <m.PieChart>
                <m.Pie data={modeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {modeData.map((_, i) => (
                    <m.Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </m.Pie>
                <m.Tooltip formatter={(v: number) => formatINR(v)} />
              </m.PieChart>
            </m.ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }
})));

export function PaymentAnalytics() {
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { clients } = useClients();

  const trendData = useMemo(() => {
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStr = m.toLocaleString('en-IN', { month: 'short' });
      const collected = payments
        .filter(p => { const d = new Date(p.payment_date); return d >= m && d <= mEnd; })
        .reduce((s, p) => s + Number(p.amount), 0);
      const invoiced = invoices
        .filter(inv => { const d = new Date(inv.date_issued); return d >= m && d <= mEnd && inv.status !== 'draft'; })
        .reduce((s, inv) => s + Number(inv.grand_total), 0);
      data.push({ month: monthStr, collected, invoiced });
    }
    return data;
  }, [payments, invoices]);

  const modeData = useMemo(() => {
    const modes: Record<string, number> = {};
    for (const p of payments) {
      const mode = (p.payment_mode || 'cash').replace(/_/g, ' ');
      const label = mode.charAt(0).toUpperCase() + mode.slice(1);
      modes[label] = (modes[label] || 0) + Number(p.amount);
    }
    // Also count invoices marked paid directly
    for (const inv of invoices) {
      if (inv.status === 'paid' && inv.payment_mode) {
        const mode = inv.payment_mode.replace(/_/g, ' ');
        const label = mode.charAt(0).toUpperCase() + mode.slice(1);
        // Only add if no payment record exists for this invoice
        const hasPayment = payments.some(p => p.invoice_id === inv.id);
        if (!hasPayment) {
          modes[label] = (modes[label] || 0) + Number(inv.grand_total);
        }
      }
    }
    return Object.entries(modes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [payments, invoices]);

  // Aging analysis
  const agingBuckets = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets = { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
    const unpaid = invoices.filter(i => i.status === 'finalized');
    for (const inv of unpaid) {
      if (!inv.date_due) { buckets.current += Number(inv.grand_total); continue; }
      const due = new Date(inv.date_due);
      const days = Math.ceil((now.getTime() - due.getTime()) / 86400000);
      if (days <= 0) buckets.current += Number(inv.grand_total);
      else if (days <= 30) buckets['1_30'] += Number(inv.grand_total);
      else if (days <= 60) buckets['31_60'] += Number(inv.grand_total);
      else if (days <= 90) buckets['61_90'] += Number(inv.grand_total);
      else buckets['90_plus'] += Number(inv.grand_total);
    }
    return buckets;
  }, [invoices]);

  const totalOutstanding = Object.values(agingBuckets).reduce((s, v) => s + v, 0);

  // Collection rate
  const collectionRate = useMemo(() => {
    const finalized = invoices.filter(i => i.status === 'finalized' || i.status === 'paid');
    const paid = invoices.filter(i => i.status === 'paid');
    if (finalized.length === 0) return 100;
    return Math.round((paid.length / finalized.length) * 100);
  }, [invoices]);

  // Average collection time
  const avgCollectionDays = useMemo(() => {
    const paidWithDates = invoices.filter(i => i.status === 'paid' && i.payment_date && i.date_issued);
    if (paidWithDates.length === 0) return 0;
    const total = paidWithDates.reduce((s, i) => {
      const issued = new Date(i.date_issued).getTime();
      const paid = new Date(i.payment_date!).getTime();
      return s + Math.max(0, Math.ceil((paid - issued) / 86400000));
    }, 0);
    return Math.round(total / paidWithDates.length);
  }, [invoices]);

  const agingRows = [
    { label: 'Current', amount: agingBuckets.current, color: 'bg-success' },
    { label: '1–30 days', amount: agingBuckets['1_30'], color: 'bg-warning' },
    { label: '31–60 days', amount: agingBuckets['31_60'], color: 'bg-orange-500' },
    { label: '61–90 days', amount: agingBuckets['61_90'], color: 'bg-destructive/70' },
    { label: '90+ days', amount: agingBuckets['90_plus'], color: 'bg-destructive' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="w-3.5 h-3.5" />Collection Rate</div>
            <p className="text-2xl font-bold">{collectionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-3.5 h-3.5" />Avg Collection Days</div>
            <p className="text-2xl font-bold">{avgCollectionDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CreditCard className="w-3.5 h-3.5" />Total Collected</div>
            <p className="text-2xl font-bold">{formatINR(payments.reduce((s, p) => s + Number(p.amount), 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertTriangle className="w-3.5 h-3.5" />Outstanding</div>
            <p className="text-2xl font-bold text-destructive">{formatINR(totalOutstanding)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {(trendData.some(d => d.collected > 0 || d.invoiced > 0) || modeData.length > 0) ? (
        <Suspense fallback={<div className="h-60 flex items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
          <RechartsComponents trendData={trendData} modeData={modeData} />
        </Suspense>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Charts will appear as payments are recorded
          </CardContent>
        </Card>
      )}

      {/* Aging Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Aging Analysis</CardTitle>
          <CardDescription>Outstanding amount by overdue duration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agingRows.map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs w-20 text-muted-foreground">{row.label}</span>
                <div className="flex-1">
                  <Progress value={totalOutstanding > 0 ? (row.amount / totalOutstanding) * 100 : 0} className="h-2" />
                </div>
                <span className="text-xs font-medium tabular-nums w-24 text-right">{formatINR(row.amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
