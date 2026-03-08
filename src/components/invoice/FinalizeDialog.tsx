import { Send, Loader2, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StockImpactItem {
  name: string;
  currentStock: number;
  deduction: number;
  newStock: number;
  isNegative: boolean;
}

interface FinalizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isFinalizing: boolean;
  stockImpactItems: StockImpactItem[];
}

export function FinalizeDialog({
  open,
  onOpenChange,
  onConfirm,
  isFinalizing,
  stockImpactItems,
}: FinalizeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalize Invoice</DialogTitle>
          <DialogDescription>
            This will mark the invoice as sent and deduct stock for all goods items. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {stockImpactItems.length > 0 && (
          <div className="py-2">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock Impact
            </h4>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Current</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Deduct</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">After</th>
                  </tr>
                </thead>
                <tbody>
                  {stockImpactItems.map((item, idx) => (
                    <tr key={idx} className={cn('border-t border-border/50', item.isNegative && 'bg-destructive/5')}>
                      <td className="py-2 px-3 font-medium">{item.name}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{item.currentStock}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-destructive">-{item.deduction}</td>
                      <td className={cn('py-2 px-3 text-right tabular-nums font-semibold', item.isNegative ? 'text-destructive' : 'text-success')}>
                        {item.newStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stockImpactItems.some((item) => item.isNegative) && (
              <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span>Warning: Some products will go into negative stock!</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isFinalizing} className="gap-2">
            {isFinalizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Confirm & Finalize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
