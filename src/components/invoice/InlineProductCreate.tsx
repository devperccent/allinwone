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
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

interface InlineProductCreateProps {
  onCreated: (product: Product) => void;
  triggerLabel?: string;
}

export function InlineProductCreate({ onCreated, triggerLabel }: InlineProductCreateProps) {
  const { createProduct } = useProducts();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const generateSku = () => {
    const prefix = name.trim().substring(0, 3).toUpperCase() || 'PRD';
    return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  };

  const handleCreate = () => {
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
          setOpen(false);
          setName('');
          setPrice('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 w-full justify-start text-primary">
          <Plus className="w-4 h-4" />
          {triggerLabel || 'Quick Add Product'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick Add Product</DialogTitle>
          <DialogDescription>Name and price is all you need. SKU is auto-generated.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="quick-product-name">Product Name *</Label>
            <Input
              id="quick-product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Wireless Mouse"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="quick-product-price">Selling Price (₹) *</Label>
            <Input
              id="quick-product-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!name.trim() || createProduct.isPending}>
            {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
