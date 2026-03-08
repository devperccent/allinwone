import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function LowStockAutoPO() {
  const navigate = useNavigate();
  const { lowStockProducts, products } = useProducts();
  const { createPO } = usePurchaseOrders();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  // Only show goods with a default supplier
  const suggestable = lowStockProducts.filter(p => (p as any).default_supplier_name);

  if (suggestable.length === 0 && lowStockProducts.length === 0) return null;

  const handleCreatePO = async (product: any) => {
    if (!profile) return;
    setCreatingFor(product.id);
    try {
      const reorderQty = Math.max(product.low_stock_limit * 2 - product.stock_quantity, product.low_stock_limit);
      const po = await createPO.mutateAsync({
        supplier_name: product.default_supplier_name || 'Unknown Supplier',
        supplier_gstin: product.default_supplier_gstin || null,
        date_issued: new Date().toISOString().split('T')[0],
        subtotal: reorderQty * product.selling_price,
        total_tax: reorderQty * product.selling_price * (product.tax_rate / 100),
        grand_total: reorderQty * product.selling_price * (1 + product.tax_rate / 100),
        items: [{
          product_id: product.id,
          description: product.name,
          qty: reorderQty,
          rate: product.selling_price,
          tax_rate: Number(product.tax_rate),
          amount: reorderQty * product.selling_price * (1 + product.tax_rate / 100),
          sort_order: 0,
        }],
      });
      toast({ title: 'PO Created', description: `Draft PO created for ${product.name}` });
      navigate(`/purchase-orders/${po.id}/edit`);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreatingFor(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Reorder Suggestions</h3>
        <Badge variant="secondary" className="text-[10px] h-5">{lowStockProducts.length} low</Badge>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {lowStockProducts.slice(0, 8).map((product) => {
          const hasSup = !!(product as any).default_supplier_name;
          return (
            <div key={product.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
              <div>
                <p className="text-xs font-medium">{product.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Stock: {product.stock_quantity} / Min: {product.low_stock_limit}
                  {hasSup && ` • ${(product as any).default_supplier_name}`}
                </p>
              </div>
              {hasSup ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-7"
                  disabled={creatingFor === product.id}
                  onClick={() => handleCreatePO(product)}
                >
                  {creatingFor === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
                  Create PO
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs text-muted-foreground h-7"
                  onClick={() => navigate('/purchase-orders/new')}
                >
                  <ArrowRight className="w-3 h-3" />
                  Manual PO
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
