import { formatINR } from '@/hooks/useInvoiceCalculations';

interface InvoiceTotalsProps {
  calculations: {
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    grandTotal: number;
    gstBreakdown: { type: string; cgst: number; sgst: number; igst: number };
  };
}

export function InvoiceTotals({ calculations }: InvoiceTotalsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums">{formatINR(calculations.subtotal)}</span>
        </div>
        {calculations.totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium tabular-nums text-success">
              -{formatINR(calculations.totalDiscount)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {calculations.gstBreakdown.type === 'intra-state' ? (
              <>
                CGST ({formatINR(calculations.gstBreakdown.cgst)}) + SGST (
                {formatINR(calculations.gstBreakdown.sgst)})
              </>
            ) : (
              <>IGST</>
            )}
          </span>
          <span className="font-medium tabular-nums">{formatINR(calculations.totalTax)}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="text-lg font-semibold">Grand Total</span>
          <span className="text-2xl font-bold tabular-nums text-primary">
            {formatINR(calculations.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
