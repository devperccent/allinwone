import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients } from '@/hooks/useClients';
import type { Client } from '@/types';

interface InlineClientCreateProps {
  onCreated: (client: Client) => void;
  triggerLabel?: string;
}

export function InlineClientCreate({ onCreated, triggerLabel }: InlineClientCreateProps) {
  const { createClient } = useClients();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    createClient.mutate(
      { name, phone: phone || undefined, state_code: '27' },
      {
        onSuccess: (data) => {
          onCreated(data as Client);
          setExpanded(false);
          setName('');
          setPhone('');
        },
      }
    );
  };

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 w-full justify-start text-primary"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(true);
        }}
      >
        <Plus className="w-4 h-4" />
        {triggerLabel || 'Quick Add Client'}
      </Button>
    );
  }

  return (
    <div className="space-y-2 p-1" onClick={(e) => e.stopPropagation()}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Client name *"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            handleCreate(e as any);
          }
          e.stopPropagation();
        }}
      />
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            handleCreate(e as any);
          }
          e.stopPropagation();
        }}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!name.trim() || createClient.isPending}
          className="flex-1"
        >
          {createClient.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(false);
            setName('');
            setPhone('');
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
