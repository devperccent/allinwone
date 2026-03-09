import { useState, useMemo } from 'react';
import { Upload, FileSpreadsheet, Check, X, Link2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format, parse, isValid } from 'date-fns';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  matched?: boolean;
  matchedInvoiceId?: string;
  matchedInvoiceNumber?: string;
}

export function BankReconciliation() {
  const { toast } = useToast();
  const { invoices } = useInvoices();
  const { recordPayment } = usePayments();

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // Get unpaid/partially paid invoices
  const unpaidInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'finalized');
  }, [invoices]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      // Parse transactions (assuming common bank statement format)
      const parsed: BankTransaction[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as (string | number)[];
        if (!row || row.length < 3) continue;

        // Try to find date, description, and amount columns
        let dateStr = '';
        let description = '';
        let credit = 0;
        let debit = 0;

        // Common formats: Date, Description, Debit, Credit or Date, Description, Amount
        for (let j = 0; j < row.length; j++) {
          const val = row[j];
          if (!val) continue;

          const strVal = String(val).trim();

          // Check if it's a date
          if (!dateStr && /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(strVal)) {
            dateStr = strVal;
            continue;
          }

          // Check if it's a number (amount)
          const numVal = parseFloat(String(val).replace(/[,₹]/g, ''));
          if (!isNaN(numVal) && numVal !== 0) {
            if (numVal > 0) credit = numVal;
            else debit = Math.abs(numVal);
            continue;
          }

          // Otherwise treat as description
          if (!description && strVal.length > 3) {
            description = strVal;
          }
        }

        if (dateStr && (credit > 0 || debit > 0)) {
          let parsedDate: Date | null = null;
          const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'];
          for (const fmt of formats) {
            try {
              const d = parse(dateStr, fmt, new Date());
              if (isValid(d)) {
                parsedDate = d;
                break;
              }
            } catch {}
          }

          parsed.push({
            id: `txn-${i}`,
            date: parsedDate ? format(parsedDate, 'yyyy-MM-dd') : dateStr,
            description: description || 'Bank Transaction',
            amount: credit || debit,
            type: credit > 0 ? 'credit' : 'debit',
            matched: false,
          });
        }
      }

      // Auto-match with invoices
      const matched = parsed.map((txn) => {
        if (txn.type !== 'credit') return txn;

        // Try to match by amount
        const matchingInvoice = unpaidInvoices.find(
          (inv) => Math.abs(Number(inv.grand_total) - txn.amount) < 1
        );

        if (matchingInvoice) {
          return {
            ...txn,
            matched: true,
            matchedInvoiceId: matchingInvoice.id,
            matchedInvoiceNumber: matchingInvoice.invoice_number,
          };
        }

        // Try to match by invoice number in description
        const invMatch = unpaidInvoices.find((inv) =>
          txn.description.toLowerCase().includes(inv.invoice_number.toLowerCase())
        );

        if (invMatch) {
          return {
            ...txn,
            matched: true,
            matchedInvoiceId: invMatch.id,
            matchedInvoiceNumber: invMatch.invoice_number,
          };
        }

        return txn;
      });

      setTransactions(matched);

      const matchedCount = matched.filter((t) => t.matched).length;
      toast({
        title: 'Statement imported',
        description: `Found ${parsed.length} transactions, auto-matched ${matchedCount}`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Could not parse the bank statement. Please check the format.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReconcile = async () => {
    const toReconcile = transactions.filter((t) => t.matched && t.matchedInvoiceId);
    if (toReconcile.length === 0) {
      toast({ title: 'No matches', description: 'No matched transactions to reconcile.' });
      return;
    }

    setIsReconciling(true);

    try {
      for (const txn of toReconcile) {
        await recordPayment.mutateAsync({
          invoice_id: txn.matchedInvoiceId!,
          client_id: null,
          amount: txn.amount,
          payment_mode: 'neft',
          payment_date: txn.date,
          reference_number: txn.description.substring(0, 50),
          notes: 'Auto-reconciled from bank statement',
        });
      }

      toast({
        title: 'Reconciliation complete',
        description: `Recorded ${toReconcile.length} payments`,
      });

      // Clear matched transactions
      setTransactions((prev) => prev.filter((t) => !t.matched));
    } catch (error) {
      toast({
        title: 'Reconciliation failed',
        description: 'Some payments could not be recorded.',
        variant: 'destructive',
      });
    } finally {
      setIsReconciling(false);
    }
  };

  const unmatchTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, matched: false, matchedInvoiceId: undefined, matchedInvoiceNumber: undefined } : t
      )
    );
  };

  const matchedCount = transactions.filter((t) => t.matched).length;
  const creditTransactions = transactions.filter((t) => t.type === 'credit');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Bank Reconciliation
        </CardTitle>
        <CardDescription>
          Upload your bank statement CSV/Excel to auto-match payments with invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="bank-statement-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="bank-statement-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground" />
            )}
            <p className="font-medium">
              {isProcessing ? 'Processing...' : 'Drop bank statement or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">Supports CSV, XLS, XLSX</p>
          </label>
        </div>

        {/* Transactions */}
        {transactions.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {creditTransactions.length} credits found • {matchedCount} matched
                </span>
              </div>
              <Button onClick={handleReconcile} disabled={matchedCount === 0 || isReconciling}>
                {isReconciling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reconcile {matchedCount} Payments
              </Button>
            </div>

            <ScrollArea className="h-64 rounded-lg border">
              <div className="p-2 space-y-2">
                {creditTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      txn.matched ? 'bg-success/5 border-success/30' : 'bg-card'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.date}</p>
                    </div>
                    <p className="font-semibold text-success">{formatINR(txn.amount)}</p>
                    {txn.matched ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-success border-success/30">
                          <Check className="w-3 h-3 mr-1" />
                          {txn.matchedInvoiceNumber}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => unmatchTransaction(txn.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unmatched
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
