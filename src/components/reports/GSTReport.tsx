import { useMemo, useState } from 'react';
import { Download, FileText, IndianRupee, ArrowRightLeft, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { INDIAN_STATES, GST_RATES } from '@/types';
import type { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { exportGSTReportCSV } from '@/utils/csvExport';

interface InvoiceItemWithProduct {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
  discount: number;
  amount: number;
  product: {
    hsn_code: string | null;
    name: string;
    type: string;
  } | null;
}

interface InvoiceWithItems {
  id: string;
  invoice_number: string;
  status: string;
  date_issued: string;
  profile_id: string;
  subtotal: number;
  total_tax: number;
  total_discount: number;
  grand_total: number;
  client: {
    name: string;
    state_code: string;
    gstin: string | null;
  } | null;
  items: InvoiceItemWithProduct[];
}

// Generate month options for the last 12 months + current
function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

function getQuarterOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  
  // Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar
  const quarters = [
    { label: `Q1 Apr-Jun ${currentFY}`, start: `${currentFY}-04`, end: `${currentFY}-06` },
    { label: `Q2 Jul-Sep ${currentFY}`, start: `${currentFY}-07`, end: `${currentFY}-09` },
    { label: `Q3 Oct-Dec ${currentFY}`, start: `${currentFY}-10`, end: `${currentFY}-12` },
    { label: `Q4 Jan-Mar ${currentFY + 1}`, start: `${currentFY + 1}-01`, end: `${currentFY + 1}-03` },
  ];

  // Also include previous FY
  const prevFY = currentFY - 1;
  const prevQuarters = [
    { label: `Q1 Apr-Jun ${prevFY}`, start: `${prevFY}-04`, end: `${prevFY}-06` },
    { label: `Q2 Jul-Sep ${prevFY}`, start: `${prevFY}-07`, end: `${prevFY}-09` },
    { label: `Q3 Oct-Dec ${prevFY}`, start: `${prevFY}-10`, end: `${prevFY}-12` },
    { label: `Q4 Jan-Mar ${prevFY + 1}`, start: `${prevFY + 1}-01`, end: `${prevFY + 1}-03` },
  ];

  [...quarters, ...prevQuarters].forEach((q) => {
    options.push({ value: `${q.start}|${q.end}`, label: q.label });
  });

  return options;
}

export function GSTReport({ invoices }: { invoices: Invoice[] }) {
  const { profile } = useAuth();
  const profileStateCode = profile?.state_code || '27';
  
  const [periodType, setPeriodType] = useState<'month' | 'quarter'>('month');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth);

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const quarterOptions = useMemo(() => getQuarterOptions(), []);

  // Determine date range
  const dateRange = useMemo(() => {
    if (periodType === 'month') {
      const [year, month] = selectedPeriod.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0); // last day of month
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    } else {
      const [startMonth, endMonth] = selectedPeriod.split('|');
      const [sy, sm] = startMonth.split('-').map(Number);
      const [ey, em] = endMonth.split('-').map(Number);
      return {
        start: new Date(sy, sm - 1, 1).toISOString().split('T')[0],
        end: new Date(ey, em, 0).toISOString().split('T')[0],
      };
    }
  }, [periodType, selectedPeriod]);

  // Filter invoices by period (paid/finalized only)
  const periodInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.status !== 'paid' && inv.status !== 'finalized') return false;
      return inv.date_issued >= dateRange.start && inv.date_issued <= dateRange.end;
    });
  }, [invoices, dateRange]);

  // Fetch invoice items with products for the period invoices
  const invoiceIds = useMemo(() => periodInvoices.map((i) => i.id), [periodInvoices]);

  const itemsQuery = useQuery({
    queryKey: ['gst-report-items', invoiceIds],
    queryFn: async () => {
      if (invoiceIds.length === 0) return [];
      const { data, error } = await supabase
        .from('invoice_items')
        .select(`
          *,
          product:products(hsn_code, name, type)
        `)
        .in('invoice_id', invoiceIds);
      if (error) throw error;
      return data as InvoiceItemWithProduct[];
    },
    enabled: invoiceIds.length > 0,
  });

  const allItems = itemsQuery.data || [];

  // Build comprehensive GST analysis
  const gstAnalysis = useMemo(() => {
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;
    let intraStateCount = 0;
    let interStateCount = 0;

    // Rate-wise breakdown
    const rateWise: Record<number, { taxable: number; cgst: number; sgst: number; igst: number; total: number; count: number }> = {};
    GST_RATES.forEach((r) => {
      rateWise[r] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 };
    });

    // HSN-wise breakdown
    const hsnWise: Record<string, { hsn: string; description: string; taxable: number; cgst: number; sgst: number; igst: number; total: number; qty: number }> = {};

    // State-wise breakdown
    const stateWise: Record<string, { state: string; taxable: number; tax: number; count: number }> = {};

    periodInvoices.forEach((inv) => {
      const clientStateCode = inv.client?.state_code || profileStateCode;
      const isIntra = clientStateCode === profileStateCode;

      if (isIntra) intraStateCount++;
      else interStateCount++;

      const stateName = INDIAN_STATES[clientStateCode] || clientStateCode;
      if (!stateWise[clientStateCode]) {
        stateWise[clientStateCode] = { state: stateName, taxable: 0, tax: 0, count: 0 };
      }
      stateWise[clientStateCode].count++;

      const invItems = allItems.filter((it) => it.invoice_id === inv.id);

      invItems.forEach((item) => {
        const baseAmount = Number(item.qty) * Number(item.rate);
        const discount = Number(item.discount) || 0;
        const taxableAmount = baseAmount - discount;
        const taxRate = Number(item.tax_rate);
        const taxAmount = taxableAmount * (taxRate / 100);

        totalTaxable += taxableAmount;
        totalTax += taxAmount;

        // Rate-wise
        const rateKey = GST_RATES.includes(taxRate as any) ? taxRate : 18;
        if (!rateWise[rateKey]) rateWise[rateKey] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 };
        rateWise[rateKey].taxable += taxableAmount;
        rateWise[rateKey].count++;

        if (isIntra) {
          const half = taxAmount / 2;
          totalCGST += half;
          totalSGST += half;
          rateWise[rateKey].cgst += half;
          rateWise[rateKey].sgst += half;
        } else {
          totalIGST += taxAmount;
          rateWise[rateKey].igst += taxAmount;
        }
        rateWise[rateKey].total += taxAmount;

        // HSN-wise
        const hsn = item.product?.hsn_code || 'N/A';
        if (!hsnWise[hsn]) {
          hsnWise[hsn] = {
            hsn,
            description: item.description,
            taxable: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: 0,
            qty: 0,
          };
        }
        hsnWise[hsn].taxable += taxableAmount;
        hsnWise[hsn].qty += Number(item.qty);
        if (isIntra) {
          hsnWise[hsn].cgst += taxAmount / 2;
          hsnWise[hsn].sgst += taxAmount / 2;
        } else {
          hsnWise[hsn].igst += taxAmount;
        }
        hsnWise[hsn].total += taxAmount;

        // State-wise
        stateWise[clientStateCode].taxable += taxableAmount;
        stateWise[clientStateCode].tax += taxAmount;
      });
    });

    return {
      totalTaxable: Math.round(totalTaxable * 100) / 100,
      totalCGST: Math.round(totalCGST * 100) / 100,
      totalSGST: Math.round(totalSGST * 100) / 100,
      totalIGST: Math.round(totalIGST * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      intraStateCount,
      interStateCount,
      invoiceCount: periodInvoices.length,
      rateWise: Object.entries(rateWise)
        .filter(([_, v]) => v.count > 0)
        .map(([rate, v]) => ({ rate: Number(rate), ...v }))
        .sort((a, b) => a.rate - b.rate),
      hsnWise: Object.values(hsnWise)
        .filter((v) => v.qty > 0)
        .sort((a, b) => b.total - a.total),
      stateWise: Object.values(stateWise)
        .filter((v) => v.count > 0)
        .sort((a, b) => b.tax - a.tax),
    };
  }, [periodInvoices, allItems, profileStateCode]);

  const handleExport = () => {
    const periodLabel = periodType === 'month'
      ? monthOptions.find((o) => o.value === selectedPeriod)?.label || selectedPeriod
      : quarterOptions.find((o) => o.value === selectedPeriod)?.label || selectedPeriod;
    exportGSTReportCSV(gstAnalysis, periodLabel);
  };

  if (itemsQuery.isLoading && invoiceIds.length > 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <Select value={periodType} onValueChange={(v) => {
            setPeriodType(v as 'month' | 'quarter');
            if (v === 'quarter') {
              setSelectedPeriod(quarterOptions[0]?.value || '');
            } else {
              setSelectedPeriod(currentMonth);
            }
          }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(periodType === 'month' ? monthOptions : quarterOptions).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExport}
          disabled={gstAnalysis.invoiceCount === 0}
        >
          <Download className="w-4 h-4" />
          Export GST Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IndianRupee className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxable Value</p>
                <p className="text-lg font-bold">{formatINR(gstAnalysis.totalTaxable)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CGST + SGST</p>
                <p className="text-lg font-bold">{formatINR(gstAnalysis.totalCGST + gstAnalysis.totalSGST)}</p>
                <p className="text-[11px] text-muted-foreground">
                  ₹{gstAnalysis.totalCGST.toFixed(2)} + ₹{gstAnalysis.totalSGST.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IGST</p>
                <p className="text-lg font-bold">{formatINR(gstAnalysis.totalIGST)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {gstAnalysis.interStateCount} inter-state invoice{gstAnalysis.interStateCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Layers className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tax Liability</p>
                <p className="text-lg font-bold">{formatINR(gstAnalysis.totalTax)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {gstAnalysis.invoiceCount} invoice{gstAnalysis.invoiceCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate-wise Tax Summary</CardTitle>
          <CardDescription>GST breakdown by tax rate slab</CardDescription>
        </CardHeader>
        <CardContent>
          {gstAnalysis.rateWise.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No taxable transactions in this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">IGST</TableHead>
                    <TableHead className="text-right">Total Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gstAnalysis.rateWise.map((row) => (
                    <TableRow key={row.rate}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {row.rate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.taxable)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.cgst)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.sgst)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.igst)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{formatINR(row.total)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(gstAnalysis.totalTaxable)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(gstAnalysis.totalCGST)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(gstAnalysis.totalSGST)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(gstAnalysis.totalIGST)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(gstAnalysis.totalTax)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HSN-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">HSN-wise Summary</CardTitle>
          <CardDescription>Tax summary grouped by HSN/SAC code (GSTR-1 ready)</CardDescription>
        </CardHeader>
        <CardContent>
          {gstAnalysis.hsnWise.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No items in this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HSN/SAC</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">IGST</TableHead>
                    <TableHead className="text-right">Total Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gstAnalysis.hsnWise.map((row) => (
                    <TableRow key={row.hsn}>
                      <TableCell>
                        <Badge variant={row.hsn === 'N/A' ? 'secondary' : 'outline'} className="font-mono text-xs">
                          {row.hsn}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{row.description}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.taxable)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.cgst)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.sgst)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(row.igst)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{formatINR(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* State-wise Supply Summary */}
      {gstAnalysis.stateWise.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">State-wise Supply Summary</CardTitle>
            <CardDescription>Place of supply breakdown for GSTR-1 filing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">Tax Amount</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gstAnalysis.stateWise.map((row) => {
                    const isIntra = row.state === INDIAN_STATES[profileStateCode];
                    return (
                      <TableRow key={row.state}>
                        <TableCell className="font-medium">{row.state}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatINR(row.taxable)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatINR(row.tax)}</TableCell>
                        <TableCell>
                          <Badge variant={isIntra ? 'default' : 'secondary'} className="text-[10px]">
                            {isIntra ? 'Intra-State' : 'Inter-State'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
