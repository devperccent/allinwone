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
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useCreditNotes } from '@/hooks/useCreditNotes';
import { Loader2, FileX2 } from 'lucide-react';
import type { Invoice } from '@/types';

interface CreateCreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  onSuccess?: () => void;
}

const REASONS = [
  'Returned goods',
  'Defective product',
  'Billing error',
  'Price adjustment',
  'Service not rendered',
  'Other',
];

export function CreateCreditNoteDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: CreateCreditNoteDialogProps) {
  const { createCreditNote } = useCreditNotes();

  const [amount, setAmount] = useState(invoice ? invoice.grand_total.toString() : '');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    await createCreditNote.mutateAsync({
      invoice_id: invoice?.id || null,
      client_id: invoice?.client_id || null,
      amount: amountNum,
      reason: reason === 'Other' ? customReason : reason,
    });

    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileX2 className="w-5 h-5" />
            Create Credit Note
          </DialogTitle>
          <DialogDescription>
            {invoice
              ? `For invoice ${invoice.invoice_number} (${formatINR(Number(invoice.grand_total))})`
              : 'Create a standalone credit note'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div>
            <Label>Credit Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min={0}
              max={invoice ? Number(invoice.grand_total) : undefined}
              className="mt-1.5"
            />
            {invoice && (
              <p className="text-xs text-muted-foreground mt-1">
                Max: {formatINR(Number(invoice.grand_total))}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label>Reason</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {REASONS.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={reason === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReason(r)}
                  className="text-xs"
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          {reason === 'Other' && (
            <div>
              <Label>Specify Reason</Label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason for credit note..."
                className="mt-1.5"
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createCreditNote.isPending || !amount || parseFloat(amount) <= 0}
          >
            {createCreditNote.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Credit Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
