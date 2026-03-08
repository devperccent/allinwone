import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailRecipient: string;
  onEmailRecipientChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function EmailDialog({
  open,
  onOpenChange,
  emailRecipient,
  onEmailRecipientChange,
  onSend,
  isSending,
}: EmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invoice via Email</DialogTitle>
          <DialogDescription>
            Enter the recipient's email address to send the invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={emailRecipient}
            onChange={(e) => onEmailRecipientChange(e.target.value)}
            placeholder="client@example.com"
            className="mt-1.5"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSend} disabled={isSending || !emailRecipient}>
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
