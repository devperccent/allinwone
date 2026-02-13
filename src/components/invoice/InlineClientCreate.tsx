import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import type { Client } from '@/types';

interface InlineClientCreateProps {
  onCreated: (client: Client) => void;
  triggerLabel?: string;
}

export function InlineClientCreate({ onCreated, triggerLabel }: InlineClientCreateProps) {
  const { createClient } = useClients();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreate = () => {
    createClient.mutate(
      { name, phone: phone || undefined, state_code: '27' },
      {
        onSuccess: (data) => {
          onCreated(data as Client);
          setOpen(false);
          setName('');
          setPhone('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 w-full justify-start text-primary">
          <Plus className="w-4 h-4" />
          {triggerLabel || 'Quick Add Client'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick Add Client</DialogTitle>
          <DialogDescription>Just a name is enough to get started. You can add details later.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="quick-client-name">Client Name *</Label>
            <Input
              id="quick-client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sharma Electronics"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="quick-client-phone">Phone (optional)</Label>
            <Input
              id="quick-client-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!name.trim() || createClient.isPending}>
            {createClient.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
