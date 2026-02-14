import { useState } from 'react';
import { Package, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';

interface InlineRestockProps {
  product: Product;
  onRestocked?: (newQty: number) => void;
}

export function InlineRestock({ product, onRestocked }: InlineRestockProps) {
  const [expanded, setExpanded] = useState(false);
  const [qty, setQty] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRestock = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const amount = parseInt(qty);
    if (!amount || amount <= 0) return;

    setIsLoading(true);
    try {
      const newQty = product.stock_quantity + amount;

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQty })
        .eq('id', product.id);
      if (updateError) throw updateError;

      // Log inventory change
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          product_id: product.id,
          change_amount: amount,
          reason: 'restock',
        });
      if (logError) throw logError;

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_logs', product.id] });
      toast({ title: 'Restocked', description: `Added ${amount} units to ${product.name}.` });
      onRestocked?.(newQty);
      setExpanded(false);
      setQty('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        className="text-[11px] text-primary hover:underline font-medium"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpanded(true);
        }}
      >
        <span className="inline-flex items-center gap-0.5">
          <Plus className="w-3 h-3" /> Add stock
        </span>
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      <Input
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        className="h-6 w-16 text-xs px-1.5"
        autoFocus
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') handleRestock(e as any);
          if (e.key === 'Escape') { setExpanded(false); setQty(''); }
        }}
      />
      <Button
        size="sm"
        className="h-6 text-[11px] px-2"
        onClick={handleRestock}
        disabled={isLoading || !qty || parseInt(qty) <= 0}
      >
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Restock'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 text-[11px] px-1.5"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setExpanded(false); setQty(''); }}
      >
        ✕
      </Button>
    </div>
  );
}
