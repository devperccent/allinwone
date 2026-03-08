import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GripVertical,
  Trash2,
  AlertTriangle,
  Search,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { GST_RATES } from '@/types';
import type { Product, InvoiceItemFormData } from '@/types';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { InlineProductCreate } from '@/components/invoice/InlineProductCreate';
import { InlineRestock } from '@/components/invoice/InlineRestock';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableLineItemProps {
  item: InvoiceItemFormData;
  index: number;
  onUpdate: (id: string, updates: Partial<InvoiceItemFormData>) => void;
  onRemove: (id: string) => void;
  products: Product[];
  canRemove: boolean;
}

export function SortableLineItem({
  item,
  index,
  onUpdate,
  onRemove,
  products,
  canRemove,
}: SortableLineItemProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [productOpen, setProductOpen] = useState(false);
  const selectedProduct = products.find((p) => p.id === item.product_id);
  const isLowStock =
    selectedProduct?.type === 'goods' &&
    item.qty > selectedProduct.stock_quantity;

  const handleProductSelect = (product: Product) => {
    onUpdate(item.id, {
      product_id: product.id,
      description: product.name,
      rate: product.selling_price,
      tax_rate: Number(product.tax_rate) || 18,
    });
    setProductOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 rounded-lg border bg-card',
        isDragging && 'opacity-50 shadow-lg',
        isLowStock && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hidden sm:block"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productOpen}
                    className={cn(
                      'w-full justify-between font-normal',
                      !item.description && 'text-muted-foreground'
                    )}
                  >
                    <span className="truncate">{item.description || 'Search product...'}</span>
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-4rem)] sm:w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search products..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 space-y-2">
                          <p className="text-sm text-muted-foreground">No product found.</p>
                          <InlineProductCreate
                            onCreated={(product) => {
                              onUpdate(item.id, {
                                product_id: product.id,
                                description: product.name,
                                rate: product.selling_price,
                                tax_rate: 18,
                              });
                              setProductOpen(false);
                            }}
                          />
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => {
                          const isZeroStock = product.type === 'goods' && product.stock_quantity <= 0;
                          const isLowStockProduct = product.type === 'goods' && product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_limit;
                          return (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => handleProductSelect(product)}
                              className={cn(isZeroStock && 'opacity-70')}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{product.name}</p>
                                  {isZeroStock && (
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                      Zero Stock
                                    </span>
                                  )}
                                  {isLowStockProduct && (
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                                      Low Stock
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {product.sku} • {formatINR(product.selling_price)}
                                  {product.type === 'goods' && ` • Stock: ${product.stock_quantity}`}
                                </p>
                                {(isZeroStock || isLowStockProduct) && (
                                  <div
                                    className="flex items-center gap-1.5 mt-1.5 flex-wrap"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  >
                                    <InlineRestock product={product} />
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        navigate('/products');
                                      }}
                                    >
                                      <Package className="w-3 h-3" />
                                      Manage stock
                                    </button>
                                    {isZeroStock && (
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-full transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleProductSelect(product);
                                        }}
                                      >
                                        Use anyway
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                      <div className="border-t border-border p-1">
                        <InlineProductCreate
                          onCreated={(product) => {
                            onUpdate(item.id, {
                              product_id: product.id,
                              description: product.name,
                              rate: product.selling_price,
                              tax_rate: Number(product.tax_rate) || 18,
                            });
                            setProductOpen(false);
                          }}
                        />
                      </div>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              disabled={!canRemove}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground sm:hidden">Qty</label>
              <Input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => onUpdate(item.id, { qty: parseInt(e.target.value) || 1 })}
                className={cn('text-sm', isLowStock && 'border-destructive')}
                placeholder="Qty"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground sm:hidden">Rate</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.rate}
                onChange={(e) => onUpdate(item.id, { rate: parseFloat(e.target.value) || 0 })}
                className="text-sm"
                placeholder="Rate"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground sm:hidden">Tax</label>
              <Select
                value={String(item.tax_rate)}
                onValueChange={(v) => onUpdate(item.id, { tax_rate: parseInt(v) })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATES.map((rate) => (
                    <SelectItem key={rate} value={String(rate)}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLowStock && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>Only {selectedProduct?.stock_quantity} in stock!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
