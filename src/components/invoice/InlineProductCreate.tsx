import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { GST_RATES } from '@/types';
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
  const [stockQty, setStockQty] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('10');
  const [useCustomGst, setUseCustomGst] = useState(false);
  const [taxRate, setTaxRate] = useState('18');

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
        tax_rate: useCustomGst ? parseFloat(taxRate) || 18 : 18,
        stock_quantity: parseInt(stockQty) || 0,
        low_stock_limit: parseInt(lowStockLimit) || 10,
      },
      {
        onSuccess: (data) => {
          onCreated(data as Product);
          setExpanded(false);
          setName('');
          setPrice('');
          setStockQty('');
          setLowStockLimit('10');
          setUseCustomGst(false);
          setTaxRate('18');
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
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
          placeholder="Stock qty"
          onKeyDown={(e) => e.stopPropagation()}
        />
        <Input
          type="number"
          value={lowStockLimit}
          onChange={(e) => setLowStockLimit(e.target.value)}
          placeholder="Low stock alert"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex items-center justify-between py-1">
        <Label htmlFor="inlineCustomGst" className="text-xs cursor-pointer">Custom GST</Label>
        <Switch 
          id="inlineCustomGst"
          checked={useCustomGst} 
          onCheckedChange={setUseCustomGst}
          className="scale-75"
        />
      </div>
      {useCustomGst && (
        <Select value={taxRate} onValueChange={setTaxRate}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GST_RATES.map((rate) => (
              <SelectItem key={rate} value={String(rate)}>{rate}% GST</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
            setStockQty('');
            setLowStockLimit('10');
            setUseCustomGst(false);
            setTaxRate('18');
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
