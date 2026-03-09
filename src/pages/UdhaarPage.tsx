import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, IndianRupee, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client, Invoice } from '@/types';

interface ClientCredit {
  client: Client;
  totalDue: number;
  invoiceCount: number;
  oldestDue: string | null;
  daysOldest: number;
}

export default function UdhaarPage() {
  const { clients, isLoading: cLoading } = useClients();
  const { invoices, isLoading: iLoading } = useInvoices();
  const isLoading = cLoading || iLoading;

  const creditData = useMemo(() => {
    const clientCredits: ClientCredit[] = [];
    const today = new Date();

    for (const client of clients) {
      const unpaid = invoices.filter(
        i => i.client_id === client.id && i.status === 'finalized'
      );
      if (unpaid.length === 0 && Number(client.credit_balance) <= 0) continue;

      const totalDue = unpaid.reduce((s, i) => s + Number(i.grand_total), 0);
      const oldest = unpaid.reduce<string | null>((oldest, i) => {
        if (!oldest || i.date_issued < oldest) return i.date_issued;
        return oldest;
      }, null);

      const daysOldest = oldest
        ? Math.floor((today.getTime() - new Date(oldest).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      clientCredits.push({ client, totalDue, invoiceCount: unpaid.length, oldestDue: oldest, daysOldest });
    }

    return clientCredits.sort((a, b) => b.totalDue - a.totalDue);
  }, [clients, invoices]);

  const totalUdhaar = useMemo(() => creditData.reduce((s, c) => s + c.totalDue, 0), [creditData]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Udhaar / Credit</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Who owes you money</p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Udhaar</p>
            <p className="text-2xl font-bold text-destructive mt-1">{formatINR(totalUdhaar)}</p>
            <p className="text-xs text-muted-foreground mt-1">{creditData.length} customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Top Debtor</p>
            {creditData[0] ? (
              <>
                <p className="text-lg font-semibold mt-1 truncate">{creditData[0].client.name}</p>
                <p className="text-xs text-destructive">{formatINR(creditData[0].totalDue)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No pending dues</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Oldest Unpaid</p>
            {creditData[0] ? (
              <>
                <p className="text-lg font-semibold mt-1">{Math.max(...creditData.map(c => c.daysOldest))} days</p>
                <p className="text-xs text-muted-foreground">Since oldest invoice</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer list */}
      {creditData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No outstanding credit!</p>
            <p className="text-xs mt-1">All customers are settled ✅</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Khata</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {creditData.map(({ client, totalDue, invoiceCount, daysOldest }) => (
                <div key={client.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoiceCount} invoice{invoiceCount > 1 ? 's' : ''} pending
                      {daysOldest > 30 && (
                        <span className="text-destructive ml-1">· {daysOldest}d oldest</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{formatINR(totalDue)}</p>
                    {daysOldest > 15 && (
                      <Badge variant="destructive" className="text-[10px] mt-0.5">Overdue</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link to={`/clients`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
