import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

interface InlineProductCreateProps {
  onCreated: (product: Product) => void;
  triggerLabel?: string;
}

export function InlineProductCreate({ onCreated, triggerLabel }: InlineProductCreateProps) {
  const { createProduct } = useProducts();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const generateSku = () => {
    const prefix = name.trim().substring(0, 3).toUpperCase() || 'PRD';
    return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  };

  const handleCreate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    createProduct.mutate(
      {
        name,
        sku: generateSku(),
        type: 'goods',
        selling_price: parseFloat(price) || 0,
        stock_quantity: 0,
        low_stock_limit: 10,
      },
      {
        onSuccess: (data) => {
          onCreated(data as Product);
          setExpanded(false);
          setName('');
          setPrice('');
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
        {triggerLabel || 'Quick Add Product'}
      </Button>
    );
  }

  return (
    <div className="space-y-2 p-1" onClick={(e) => e.stopPropagation()}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Product name *"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            handleCreate(e as any);
          }
          e.stopPropagation();
        }}
      />
      <Input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Selling price (₹)"
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
          disabled={!name.trim() || createProduct.isPending}
          className="flex-1"
        >
          {createProduct.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
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
            setPrice('');
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
