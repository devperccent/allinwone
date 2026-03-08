import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { usePurchaseBills } from '@/hooks/usePurchaseBills';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function getFYOptions() {
  const now = new Date();
  const currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return [
    { value: `${currentFY}`, label: `FY ${currentFY}-${(currentFY + 1).toString().slice(2)}` },
    { value: `${currentFY - 1}`, label: `FY ${currentFY - 1}-${currentFY.toString().slice(2)}` },
  ];
}

function getMonthRange(fy: number) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(fy, 3 + i, 1); // April start
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return months;
}

export function ProfitLossReport() {
  const fyOptions = useMemo(() => getFYOptions(), []);
  const [selectedFY, setSelectedFY] = useState(fyOptions[0].value);

  const { invoices } = useInvoices();
  const { purchaseBills } = usePurchaseBills();
  const { purchaseOrders } = usePurchaseOrders();

  const fy = Number(selectedFY);
  const months = useMemo(() => getMonthRange(fy), [fy]);
  const fyStart = `${fy}-04-01`;
  const fyEnd = `${fy + 1}-03-31`;

  const pnl = useMemo(() => {
    // REVENUE: paid invoices
    const paidInvoices = invoices.filter(
      (i) => i.status === 'paid' && i.date_issued >= fyStart && i.date_issued <= fyEnd
    );
    const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.grand_total), 0);
    const totalSalesTax = paidInvoices.reduce((s, i) => s + Number(i.total_tax), 0);
    const netSales = totalRevenue - totalSalesTax;

    // EXPENSES: received purchase bills
    const receivedBills = purchaseBills.filter(
      (b) => b.status === 'received' && b.bill_date >= fyStart && b.bill_date <= fyEnd
    );
    const totalPurchases = receivedBills.reduce((s, b) => s + Number(b.grand_total), 0);
    const totalInputTax = receivedBills.reduce((s, b) => s + Number(b.total_tax), 0);
    const netPurchases = totalPurchases - totalInputTax;

    // Committed POs (sent status)
    const committedPOs = purchaseOrders.filter(
      (po) => po.status === 'sent' && po.date_issued >= fyStart && po.date_issued <= fyEnd
    );
    const totalCommitted = committedPOs.reduce((s, po) => s + Number(po.grand_total), 0);

    const grossProfit = netSales - netPurchases;
    const margin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Monthly breakdown
    const monthlyData = months.map((m) => {
      const mRevenue = paidInvoices
        .filter((i) => { const d = new Date(i.date_issued); return d.getMonth() === m.month && d.getFullYear() === m.year; })
        .reduce((s, i) => s + Number(i.grand_total) - Number(i.total_tax), 0);
      const mExpenses = receivedBills
        .filter((b) => { const d = new Date(b.bill_date); return d.getMonth() === m.month && d.getFullYear() === m.year; })
        .reduce((s, b) => s + Number(b.grand_total) - Number(b.total_tax), 0);
      return { month: m.label, revenue: Math.round(mRevenue), expenses: Math.round(mExpenses), profit: Math.round(mRevenue - mExpenses) };
    });

    return { totalRevenue, totalSalesTax, netSales, totalPurchases, totalInputTax, netPurchases, grossProfit, margin, totalCommitted, monthlyData, invoiceCount: paidInvoices.length, billCount: receivedBills.length };
  }, [invoices, purchaseBills, purchaseOrders, fyStart, fyEnd, months]);

  const handleExport = () => {
    const lines = [
      `Profit & Loss Statement - FY ${fy}-${(fy + 1).toString().slice(2)}`,
      '',
      'INCOME',
      `Total Revenue (incl. tax),${pnl.totalRevenue.toFixed(2)}`,
      `Less: Output GST,${pnl.totalSalesTax.toFixed(2)}`,
      `Net Sales,${pnl.netSales.toFixed(2)}`,
      '',
      'EXPENSES',
      `Total Purchases (incl. tax),${pnl.totalPurchases.toFixed(2)}`,
      `Less: Input GST Credit,${pnl.totalInputTax.toFixed(2)}`,
      `Net Purchases,${pnl.netPurchases.toFixed(2)}`,
      '',
      `GROSS PROFIT,${pnl.grossProfit.toFixed(2)}`,
      `Margin %,${pnl.margin.toFixed(1)}%`,
      '',
      'MONTHLY BREAKDOWN',
      'Month,Revenue,Expenses,Profit',
      ...pnl.monthlyData.map((m) => `${m.month},${m.revenue},${m.expenses},${m.profit}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `pnl-fy${fy}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={selectedFY} onValueChange={setSelectedFY}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {fyOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export P&L
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Net Sales</p>
                <p className="text-lg font-bold text-emerald-600">{formatINR(pnl.netSales)}</p>
                <p className="text-[11px] text-muted-foreground">{pnl.invoiceCount} paid invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><TrendingDown className="w-4 h-4 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Net Purchases</p>
                <p className="text-lg font-bold text-destructive">{formatINR(pnl.netPurchases)}</p>
                <p className="text-[11px] text-muted-foreground">{pnl.billCount} purchase bills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><DollarSign className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Gross Profit</p>
                <p className={`text-lg font-bold ${pnl.grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{formatINR(pnl.grossProfit)}</p>
                <p className="text-[11px] text-muted-foreground">{pnl.margin.toFixed(1)}% margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profit & Loss Statement</CardTitle>
          <CardDescription>FY {fy}-{(fy + 1).toString().slice(2)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Income</p>
            <div className="flex justify-between text-sm"><span>Gross Revenue (incl. GST)</span><span className="tabular-nums">{formatINR(pnl.totalRevenue)}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>Less: Output GST</span><span className="tabular-nums">- {formatINR(pnl.totalSalesTax)}</span></div>
            <div className="flex justify-between text-sm font-medium"><span>Net Sales</span><span className="tabular-nums">{formatINR(pnl.netSales)}</span></div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Expenses</p>
            <div className="flex justify-between text-sm"><span>Gross Purchases (incl. GST)</span><span className="tabular-nums">{formatINR(pnl.totalPurchases)}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>Less: Input Tax Credit</span><span className="tabular-nums">- {formatINR(pnl.totalInputTax)}</span></div>
            <div className="flex justify-between text-sm font-medium"><span>Net Purchases</span><span className="tabular-nums">{formatINR(pnl.netPurchases)}</span></div>
            {pnl.totalCommitted > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground"><span>Committed POs (not received)</span><span className="tabular-nums">{formatINR(pnl.totalCommitted)}</span></div>
            )}
          </div>
          <Separator />
          <div className={`flex justify-between text-base font-bold ${pnl.grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            <span>Gross Profit</span><span className="tabular-nums">{formatINR(pnl.grossProfit)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {pnl.monthlyData.every((d) => d.revenue === 0 && d.expenses === 0) ? (
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">No data yet for this financial year</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pnl.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number, name: string) => [formatINR(value), name.charAt(0).toUpperCase() + name.slice(1)]} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
