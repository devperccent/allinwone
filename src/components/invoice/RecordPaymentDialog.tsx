import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { usePayments } from '@/hooks/usePayments';
import type { Invoice, PaymentMode } from '@/types';
import { Loader2 } from 'lucide-react';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  existingPayments?: number;
  onSuccess?: () => void;
}

const paymentModes: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'neft', label: 'NEFT/RTGS' },
  { value: 'cheque', label: 'Cheque' },
];

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
  existingPayments = 0,
  onSuccess,
}: RecordPaymentDialogProps) {
  const { recordPayment } = usePayments();
  const remaining = Number(invoice.grand_total) - existingPayments;

  const [amount, setAmount] = useState(remaining.toString());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    await recordPayment.mutateAsync({
      invoice_id: invoice.id,
      client_id: invoice.client_id,
      amount: amountNum,
      payment_mode: paymentMode,
      payment_date: paymentDate,
      reference_number: reference || null,
      notes: notes || null,
    });

    onOpenChange(false);
    onSuccess?.();
  };

  const setFullAmount = () => setAmount(remaining.toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Invoice {invoice.invoice_number} • Total: {formatINR(Number(invoice.grand_total))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment summary */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Total</span>
              <span>{formatINR(Number(invoice.grand_total))}</span>
            </div>
            {existingPayments > 0 && (
              <div className="flex justify-between text-success">
                <span>Already Paid</span>
                <span>{formatINR(existingPayments)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Remaining</span>
              <span>{formatINR(remaining)}</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label>Payment Amount</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min={0}
                max={remaining}
              />
              <Button type="button" variant="outline" size="sm" onClick={setFullAmount}>
                Full
              </Button>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <Label>Payment Mode</Label>
            <RadioGroup
              value={paymentMode}
              onValueChange={(v) => setPaymentMode(v as PaymentMode)}
              className="grid grid-cols-2 gap-2 mt-1.5"
            >
              {paymentModes.map((mode) => (
                <div key={mode.value} className="flex items-center">
                  <RadioGroupItem value={mode.value} id={mode.value} className="peer sr-only" />
                  <Label
                    htmlFor={mode.value}
                    className="flex-1 text-center py-2 px-3 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-colors text-sm"
                  >
                    {mode.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Date */}
          <div>
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Reference */}
          <div>
            <Label>Reference / Transaction ID</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="UPI Ref, Cheque #, etc."
              className="mt-1.5"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="mt-1.5"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={recordPayment.isPending}>
            {recordPayment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
