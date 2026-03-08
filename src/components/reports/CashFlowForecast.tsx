import { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

export function CashFlowForecast() {
  const { invoices } = useInvoices();
  const { purchaseOrders } = usePurchaseOrders();

  const forecast = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Next 90 days
    const days: { date: string; label: string; inflow: number; outflow: number; net: number; cumulative: number }[] = [];
    let cumulative = 0;

    // Collect expected inflows (finalized unpaid invoices by due date)
    const pendingInvoices = invoices.filter((i) => i.status === 'finalized' && i.date_due);
    // Collect expected outflows (sent POs by expected delivery)
    const pendingPOs = purchaseOrders.filter((po) => po.status === 'sent' && po.expected_delivery);

    // Build 12-week buckets
    for (let w = 0; w < 12; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const wsStr = weekStart.toISOString().split('T')[0];
      const weStr = weekEnd.toISOString().split('T')[0];

      const weekInflow = pendingInvoices
        .filter((i) => i.date_due! >= wsStr && i.date_due! <= weStr)
        .reduce((s, i) => s + Number(i.grand_total), 0);

      const weekOutflow = pendingPOs
        .filter((po) => po.expected_delivery! >= wsStr && po.expected_delivery! <= weStr)
        .reduce((s, po) => s + Number(po.grand_total), 0);

      const net = weekInflow - weekOutflow;
      cumulative += net;

      days.push({
        date: wsStr,
        label: `W${w + 1} (${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
        inflow: Math.round(weekInflow),
        outflow: Math.round(weekOutflow),
        net: Math.round(net),
        cumulative: Math.round(cumulative),
      });
    }

    // Summary stats
    const totalExpectedInflow = pendingInvoices.reduce((s, i) => s + Number(i.grand_total), 0);
    const totalExpectedOutflow = pendingPOs.reduce((s, po) => s + Number(po.grand_total), 0);

    // Overdue inflows
    const overdueInflow = pendingInvoices
      .filter((i) => i.date_due! < today)
      .reduce((s, i) => s + Number(i.grand_total), 0);

    // Next 7 days
    const next7 = new Date(now);
    next7.setDate(next7.getDate() + 7);
    const next7Str = next7.toISOString().split('T')[0];
    const thisWeekInflow = pendingInvoices
      .filter((i) => i.date_due! >= today && i.date_due! <= next7Str)
      .reduce((s, i) => s + Number(i.grand_total), 0);

    return { days, totalExpectedInflow, totalExpectedOutflow, overdueInflow, thisWeekInflow, pendingInvoiceCount: pendingInvoices.length, pendingPOCount: pendingPOs.length };
  }, [invoices, purchaseOrders]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><ArrowUpRight className="w-4 h-4 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Expected Inflows</p>
                <p className="text-lg font-bold text-emerald-600">{formatINR(forecast.totalExpectedInflow)}</p>
                <p className="text-[11px] text-muted-foreground">{forecast.pendingInvoiceCount} pending invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><ArrowDownRight className="w-4 h-4 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Expected Outflows</p>
                <p className="text-lg font-bold text-destructive">{formatINR(forecast.totalExpectedOutflow)}</p>
                <p className="text-[11px] text-muted-foreground">{forecast.pendingPOCount} pending POs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="w-4 h-4 text-amber-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Due This Week</p>
                <p className="text-lg font-bold">{formatINR(forecast.thisWeekInflow)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><ArrowUpRight className="w-4 h-4 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue Inflows</p>
                <p className="text-lg font-bold text-destructive">{formatINR(forecast.overdueInflow)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">12-Week Cash Flow Forecast</CardTitle>
          <CardDescription>Projected inflows vs outflows based on due dates</CardDescription>
        </CardHeader>
        <CardContent>
          {forecast.days.every((d) => d.inflow === 0 && d.outflow === 0) ? (
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">No pending invoices or POs with due dates to forecast</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={forecast.days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatINR(value), name === 'inflow' ? 'Inflow' : name === 'outflow' ? 'Outflow' : 'Cumulative']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Area type="monotone" dataKey="inflow" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%, 0.1)" name="inflow" />
                <Area type="monotone" dataKey="outflow" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" name="outflow" />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.05)" strokeDasharray="5 5" name="cumulative" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {forecast.days.filter((d) => d.inflow > 0 || d.outflow > 0).map((d) => (
              <div key={d.date} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{d.label}</p>
                  <div className="flex gap-3 mt-1">
                    {d.inflow > 0 && <Badge variant="outline" className="text-emerald-600 border-emerald-200">↑ {formatINR(d.inflow)}</Badge>}
                    {d.outflow > 0 && <Badge variant="outline" className="text-destructive border-destructive/20">↓ {formatINR(d.outflow)}</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${d.net >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {d.net >= 0 ? '+' : ''}{formatINR(d.net)}
                  </p>
                  <p className="text-xs text-muted-foreground">cum: {formatINR(d.cumulative)}</p>
                </div>
              </div>
            ))}
            {forecast.days.every((d) => d.inflow === 0 && d.outflow === 0) && (
              <p className="text-center py-8 text-muted-foreground text-sm">No scheduled cash movements in the next 12 weeks</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
