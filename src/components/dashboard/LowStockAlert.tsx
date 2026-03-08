import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

interface LowStockAlertProps {
  products: Product[];
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-success/10">
            <Package className="w-4 h-4 text-success" />
          </div>
          <h3 className="text-sm font-semibold">Stock Status</h3>
        </div>
        <p className="text-xs text-muted-foreground">All products are well-stocked!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5">
      <div className="flex items-center justify-between px-4 py-3 border-b border-warning/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <h3 className="text-sm font-semibold">Low Stock Alert</h3>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs h-7">
          <Link to="/products?filter=low-stock">
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
      
      <div className="divide-y divide-warning/10">
        {products.slice(0, 5).map((product) => (
          <div key={product.id} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-warning">{product.stock_quantity} left</p>
              <p className="text-[10px] text-muted-foreground">Min: {product.low_stock_limit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
