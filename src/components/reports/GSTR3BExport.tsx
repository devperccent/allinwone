import { useMemo, useState } from 'react';
import { Download, FileJson, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { usePurchaseBills } from '@/hooks/usePurchaseBills';
import { useAuth } from '@/contexts/AuthContext';
import { INDIAN_STATES, GST_RATES } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    });
  }
  return options;
}

export function GSTR3BExport() {
  const { profile } = useAuth();
  const profileStateCode = profile?.state_code || '27';
  const gstin = profile?.gstin || '';
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const { invoices } = useInvoices();
  const { purchaseBills } = usePurchaseBills();

  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Fetch invoice items for output tax computation
  const periodInvoices = useMemo(() => invoices.filter(
    (i) => (i.status === 'paid' || i.status === 'finalized') && i.date_issued >= startDate && i.date_issued <= endDate
  ), [invoices, startDate, endDate]);

  const periodBills = useMemo(() => purchaseBills.filter(
    (b) => b.status === 'received' && b.bill_date >= startDate && b.bill_date <= endDate
  ), [purchaseBills, startDate, endDate]);

  const invoiceIds = useMemo(() => periodInvoices.map((i) => i.id), [periodInvoices]);

  const itemsQuery = useQuery({
    queryKey: ['gstr3b-items', invoiceIds],
    queryFn: async () => {
      if (invoiceIds.length === 0) return [];
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*, product:products(hsn_code)')
        .in('invoice_id', invoiceIds);
      if (error) throw error;
      return data;
    },
    enabled: invoiceIds.length > 0,
  });

  const gstr3b = useMemo(() => {
    const allItems = itemsQuery.data || [];

    // 3.1 - Outward supplies
    let interTaxable = 0, interIgst = 0;
    let intraTaxable = 0, intraCgst = 0, intraSgst = 0;

    periodInvoices.forEach((inv) => {
      const clientState = inv.client?.state_code || profileStateCode;
      const isIntra = clientState === profileStateCode;
      const items = allItems.filter((it) => it.invoice_id === inv.id);

      items.forEach((item) => {
        const taxable = Number(item.qty) * Number(item.rate) - (Number(item.discount) || 0);
        const tax = taxable * (Number(item.tax_rate) / 100);
        if (isIntra) {
          intraTaxable += taxable;
          intraCgst += tax / 2;
          intraSgst += tax / 2;
        } else {
          interTaxable += taxable;
          interIgst += tax;
        }
      });
    });

    // 4 - Input Tax Credit (from purchase bills)
    let itcIgst = 0, itcCgst = 0, itcSgst = 0;
    periodBills.forEach((bill) => {
      // Assume all purchase bills are intra-state for simplification
      // In reality, you'd check supplier GSTIN state code
      const supplierState = bill.supplier_gstin ? bill.supplier_gstin.substring(0, 2) : profileStateCode;
      const isIntra = supplierState === profileStateCode;
      const tax = Number(bill.total_tax);
      if (isIntra) {
        itcCgst += tax / 2;
        itcSgst += tax / 2;
      } else {
        itcIgst += tax;
      }
    });

    // 6.1 - Net tax payable
    const netIgst = Math.max(0, interIgst - itcIgst);
    const netCgst = Math.max(0, intraCgst - itcCgst);
    const netSgst = Math.max(0, intraSgst - itcSgst);

    return {
      outward: { interTaxable: r(interTaxable), interIgst: r(interIgst), intraTaxable: r(intraTaxable), intraCgst: r(intraCgst), intraSgst: r(intraSgst) },
      itc: { igst: r(itcIgst), cgst: r(itcCgst), sgst: r(itcSgst) },
      net: { igst: r(netIgst), cgst: r(netCgst), sgst: r(netSgst), total: r(netIgst + netCgst + netSgst) },
    };
  }, [periodInvoices, periodBills, itemsQuery.data, profileStateCode]);

  function r(n: number) { return Math.round(n * 100) / 100; }

  const exportJSON = () => {
    const json = {
      gstin,
      ret_period: `${String(month).padStart(2, '0')}${year}`,
      sup_details: {
        osup_det: { txval: gstr3b.outward.intraTaxable + gstr3b.outward.interTaxable, camt: gstr3b.outward.intraCgst, samt: gstr3b.outward.intraSgst, iamt: gstr3b.outward.interIgst },
      },
      itc_elg: {
        itc_avl: [
          { ty: 'IMPG', iamt: 0, camt: 0, samt: 0 },
          { ty: 'ISRC', iamt: 0, camt: 0, samt: 0 },
          { ty: 'ISD', iamt: 0, camt: 0, samt: 0 },
          { ty: 'OTH', iamt: gstr3b.itc.igst, camt: gstr3b.itc.cgst, samt: gstr3b.itc.sgst },
        ],
        itc_net: { iamt: gstr3b.itc.igst, camt: gstr3b.itc.cgst, samt: gstr3b.itc.sgst },
      },
      intr_ltfee: { intr_det: { iamt: 0, camt: 0, samt: 0 } },
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR3B-${gstin || 'draft'}-${String(month).padStart(2, '0')}${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportJSON}>
          <FileJson className="w-4 h-4" /> Export GSTR-3B JSON
        </Button>
      </div>

      {!gstin && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Add your GSTIN in Settings for accurate GSTR-3B filing.</AlertDescription>
        </Alert>
      )}

      {/* Table 3.1 - Outward Supplies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3.1 - Tax on Outward Supplies</CardTitle>
          <CardDescription>Output tax from your sales invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nature of Supplies</TableHead>
                <TableHead className="text-right">Taxable Value</TableHead>
                <TableHead className="text-right">IGST</TableHead>
                <TableHead className="text-right">CGST</TableHead>
                <TableHead className="text-right">SGST</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Outward taxable supplies (other than zero/nil/exempt)</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.outward.intraTaxable + gstr3b.outward.interTaxable)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.outward.interIgst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.outward.intraCgst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.outward.intraSgst)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Table 4 - ITC */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">4 - Eligible Input Tax Credit</CardTitle>
          <CardDescription>ITC from {periodBills.length} purchase bill{periodBills.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">IGST</TableHead>
                <TableHead className="text-right">CGST</TableHead>
                <TableHead className="text-right">SGST</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">All other ITC</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.itc.igst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.itc.cgst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.itc.sgst)}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Net ITC Available</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.itc.igst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.itc.cgst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.itc.sgst)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Table 6 - Net Tax */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">6.1 - Tax Payable</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">IGST</TableHead>
                <TableHead className="text-right">CGST</TableHead>
                <TableHead className="text-right">SGST</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total Tax</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.outward.interIgst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.outward.intraCgst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.outward.intraSgst)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ITC Claimed</TableCell>
                <TableCell className="text-right tabular-nums">- {formatINR(gstr3b.itc.igst)}</TableCell>
                <TableCell className="text-right tabular-nums">- {formatINR(gstr3b.itc.cgst)}</TableCell>
                <TableCell className="text-right tabular-nums">- {formatINR(gstr3b.itc.sgst)}</TableCell>
              </TableRow>
              <TableRow className="bg-primary/5 font-bold">
                <TableCell>Net Tax Payable</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.net.igst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.net.cgst)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(gstr3b.net.sgst)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Total Payable: {formatINR(gstr3b.net.total)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
