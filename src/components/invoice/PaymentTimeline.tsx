import { format } from 'date-fns';
import { CreditCard, CheckCircle, Clock, FileText } from 'lucide-react';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Payment } from '@/hooks/usePayments';

interface PaymentTimelineProps {
  payments: Payment[];
  invoiceTotal: number;
  className?: string;
}

export function PaymentTimeline({ payments, invoiceTotal, className }: PaymentTimelineProps) {
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = invoiceTotal - totalPaid;
  const isPaidFull = remaining <= 0;

  if (payments.length === 0) {
    return (
      <div className={cn('p-4 rounded-lg border border-dashed text-center text-muted-foreground', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No payments recorded yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="text-sm text-muted-foreground">Total Paid</p>
          <p className="text-lg font-bold">{formatINR(totalPaid)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className={cn('text-lg font-bold', isPaidFull ? 'text-success' : 'text-warning')}>
            {isPaidFull ? 'Paid in Full' : formatINR(remaining)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
        
        {payments.map((payment, index) => (
          <div key={payment.id} className="relative pb-4 last:pb-0">
            <div className={cn(
              'absolute left-[-16px] w-6 h-6 rounded-full flex items-center justify-center',
              index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted border-2 border-border'
            )}>
              <CreditCard className="w-3 h-3" />
            </div>
            
            <div className="ml-4 p-3 rounded-lg bg-card border">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{formatINR(Number(payment.amount))}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs capitalize">
                  {payment.payment_mode}
                </Badge>
              </div>
              {payment.reference_number && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ref: {payment.reference_number}
                </p>
              )}
              {payment.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {payment.notes}
                </p>
              )}
            </div>
          </div>
        ))}

        {isPaidFull && (
          <div className="relative">
            <div className="absolute left-[-16px] w-6 h-6 rounded-full flex items-center justify-center bg-success text-success-foreground">
              <CheckCircle className="w-3 h-3" />
            </div>
            <div className="ml-4 p-2 text-sm text-success font-medium">
              Invoice Paid in Full
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
