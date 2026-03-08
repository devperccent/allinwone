import { useMemo, useState, useRef } from 'react';
import { Printer, User, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';

interface LedgerEntry {
  date: string;
  type: 'invoice' | 'payment';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

export function PartyLedger() {
  const { profile } = useAuth();
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [search, setSearch] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const ledger = useMemo(() => {
    if (!selectedClientId) return [];

    const clientInvoices = invoices
      .filter((i) => i.client_id === selectedClientId && i.status !== 'draft')
      .sort((a, b) => a.date_issued.localeCompare(b.date_issued));

    const entries: LedgerEntry[] = [];
    let balance = 0;

    clientInvoices.forEach((inv) => {
      // Invoice raised = debit (money owed to you)
      if (inv.status === 'finalized' || inv.status === 'paid') {
        balance += Number(inv.grand_total);
        entries.push({
          date: inv.date_issued,
          type: 'invoice',
          reference: inv.invoice_number,
          debit: Number(inv.grand_total),
          credit: 0,
          balance,
          status: inv.status,
        });
      }

      // Payment received = credit
      if (inv.status === 'paid' && inv.payment_date) {
        balance -= Number(inv.grand_total);
        entries.push({
          date: inv.payment_date,
          type: 'payment',
          reference: `Payment for ${inv.invoice_number}`,
          debit: 0,
          credit: Number(inv.grand_total),
          balance,
          status: 'paid',
        });
      }
    });

    return entries;
  }, [selectedClientId, invoices]);

  const totalDebit = ledger.reduce((s, e) => s + e.debit, 0);
  const totalCredit = ledger.reduce((s, e) => s + e.credit, 0);
  const closingBalance = totalDebit - totalCredit;

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Ledger - ${selectedClient?.name || ''}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .right { text-align: right; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { color: #666; margin-bottom: 16px; }
        .total { font-weight: bold; background: #f0f0f0; }
      </style></head><body>
      <h1>Account Statement</h1>
      <div class="meta">
        <p><strong>Client:</strong> ${selectedClient?.name || ''}</p>
        <p><strong>From:</strong> ${profile?.org_name || ''}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      ${printRef.current.innerHTML}
      <div style="margin-top: 20px; text-align: right;">
        <p><strong>Closing Balance: ${closingBalance >= 0 ? formatINR(closingBalance) + ' (Receivable)' : formatINR(Math.abs(closingBalance)) + ' (Payable)'}</strong></p>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Client Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select a client" /></SelectTrigger>
          <SelectContent>
            {filteredClients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClientId && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print Statement
          </Button>
        )}
      </div>

      {!selectedClientId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Select a client to view their ledger statement</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground">Total Invoiced</p>
                <p className="text-lg font-bold">{formatINR(totalDebit)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground">Total Received</p>
                <p className="text-lg font-bold text-emerald-600">{formatINR(totalCredit)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`text-lg font-bold ${closingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatINR(Math.abs(closingBalance))}
                  <span className="text-xs font-normal ml-1">{closingBalance > 0 ? '(Receivable)' : closingBalance < 0 ? '(Payable)' : ''}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ledger Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ledger for {selectedClient?.name}</CardTitle>
              <CardDescription>All transactions sorted by date</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={printRef}>
                {ledger.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">No transactions found for this client</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Particulars</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={4} className="font-medium">Opening Balance</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatINR(0)}</TableCell>
                      </TableRow>
                      {ledger.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{e.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={e.type === 'invoice' ? 'default' : 'outline'} className="text-xs">
                                {e.type === 'invoice' ? 'INV' : 'PMT'}
                              </Badge>
                              <span className="text-sm">{e.reference}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{e.debit > 0 ? formatINR(e.debit) : '-'}</TableCell>
                          <TableCell className="text-right tabular-nums">{e.credit > 0 ? formatINR(e.credit) : '-'}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{formatINR(e.balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>Closing Balance</TableCell>
                        <TableCell className="text-right tabular-nums">{formatINR(totalDebit)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatINR(totalCredit)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatINR(closingBalance)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
