import { useState, useRef, useMemo, memo } from 'react';
import { useProductBatches, ProductBatch } from '@/hooks/useProductBatches';
import {
  Plus,
  Search,
  Package,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  History,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useProducts } from '@/hooks/useProducts';
import { useInventoryLogs } from '@/hooks/useInventoryLogs';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, ProductType } from '@/types';
import { GST_RATES } from '@/types';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import { BarcodeScanButton } from '@/components/scanner/BarcodeScanner';

export default function ProductsPage() {
  const { products, isLoading, createProduct, deleteProduct } = useProducts();
  // Single bulk fetch of ALL batches — eliminates N+1 per-product queries
  const { batches: allBatches } = useProductBatches();
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockSheetOpen, setStockSheetOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    type: 'goods' as ProductType,
    selling_price: '',
    hsn_code: '',
    stock_quantity: '',
    low_stock_limit: '10',
    useCustomGst: false,
    tax_rate: '18',
    barcode: '',
  });

  // Pre-compute batch map once for O(1) lookup per product
  const batchesByProduct = useMemo(() => {
    const map = new Map<string, ProductBatch[]>();
    for (const b of allBatches) {
      const arr = map.get(b.product_id);
      if (arr) arr.push(b);
      else map.set(b.product_id, [b]);
    }
    return map;
  }, [allBatches]);

  const filteredProducts = useMemo(() =>
    products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((product as any).barcode || '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [products, searchQuery]
  );

  // Page shortcuts: / → focus search, A → add product
  usePageShortcuts(useMemo(() => [
    { key: '/', handler: () => searchRef.current?.focus() },
    { key: 'a', handler: () => setIsAddDialogOpen(true) },
  ], []));

  const isLowStock = (product: Product) =>
    product.type === 'goods' && product.stock_quantity <= product.low_stock_limit;

  const handleSubmit = () => {
    createProduct.mutate({
      name: formData.name,
      sku: formData.sku,
      type: formData.type,
      selling_price: parseFloat(formData.selling_price) || 0,
      hsn_code: formData.hsn_code || undefined,
      tax_rate: formData.useCustomGst ? parseFloat(formData.tax_rate) || 18 : 18,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      low_stock_limit: parseInt(formData.low_stock_limit) || 10,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setFormData({
          name: '',
          sku: '',
          type: 'goods',
          selling_price: '',
          hsn_code: '',
          stock_quantity: '',
          low_stock_limit: '10',
          useCustomGst: false,
          tax_rate: '18',
          barcode: '',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Products</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Add a new product or service to your inventory.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Wireless Mouse"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input 
                    id="sku" 
                    placeholder="e.g., WM-001"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as ProductType }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goods">Goods</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Selling Price (₹) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="0.00"
                    value={formData.selling_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hsn">HSN/SAC Code</Label>
                  <Input 
                    id="hsn" 
                    placeholder="e.g., 8471"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barcode">Barcode / EAN</Label>
                <Input 
                  id="barcode" 
                  placeholder="Scan or type barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div>
                  <Label htmlFor="customGst" className="text-sm font-medium cursor-pointer">Custom GST Rate</Label>
                  <p className="text-xs text-muted-foreground">Default is 18%</p>
                </div>
                <Switch 
                  id="customGst"
                  checked={formData.useCustomGst} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useCustomGst: checked }))} 
                />
              </div>
              {formData.useCustomGst && (
                <div className="grid gap-2">
                  <Label htmlFor="taxRate">GST Rate (%)</Label>
                  <Select 
                    value={formData.tax_rate} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, tax_rate: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GST_RATES.map((rate) => (
                        <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {formData.type === 'goods' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      placeholder="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lowStock">Low Stock Limit</Label>
                    <Input 
                      id="lowStock" 
                      type="number" 
                      placeholder="10"
                      value={formData.low_stock_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_limit: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createProduct.isPending || !formData.name || !formData.sku}
              >
                {createProduct.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                ) : 'Add Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <BarcodeScanButton onScan={(code) => setSearchQuery(code)} />
      </div>

      {/* Products Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-10 rounded-lg border border-border bg-card">
            <Package className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No products found</p>
            <Button variant="link" size="sm" onClick={() => setIsAddDialogOpen(true)} className="mt-1">
              Add your first product
            </Button>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              batches={batchesByProduct.get(product.id) || EMPTY_BATCHES}
              isLowStock={isLowStock(product)}
              onStockHistory={() => { setSelectedProduct(product); setStockSheetOpen(true); }}
              onDelete={() => deleteProduct.mutate(product.id)}
            />
          ))
        )}
      </div>

      {/* Stock History Sheet — only fetch detailed data when open */}
      {stockSheetOpen && selectedProduct && (
        <StockHistorySheet
          product={selectedProduct}
          open={stockSheetOpen}
          onOpenChange={setStockSheetOpen}
        />
      )}
    </div>
  );
}

const EMPTY_BATCHES: ProductBatch[] = [];

// Memoized ProductCard — no longer calls useProductBatches individually
const ProductCard = memo(function ProductCard({
  product,
  batches,
  isLowStock: lowStock,
  onStockHistory,
  onDelete,
}: {
  product: Product;
  batches: ProductBatch[];
  isLowStock: boolean;
  onStockHistory: () => void;
  onDelete: () => void;
}) {
  const now = Date.now();
  const nearestExpiry = batches.find(b => b.expiry_date && new Date(b.expiry_date).getTime() > now);

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors hover:bg-muted/20',
        lowStock ? 'border-warning/50' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-medium text-sm truncate">{product.name}</h3>
            {lowStock && <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{product.sku}{product.hsn_code ? ` · HSN ${product.hsn_code}` : ''}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {product.type === 'goods' && (
              <DropdownMenuItem onClick={onStockHistory}>
                <History className="w-4 h-4 mr-2" />Stock History
              </DropdownMenuItem>
            )}
            <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-lg font-bold tabular-nums">{formatINR(Number(product.selling_price))}</p>
        {product.type === 'goods' && (
          <p className={cn('text-xs font-medium tabular-nums', lowStock ? 'text-warning' : 'text-muted-foreground')}>
            {product.stock_quantity} in stock
          </p>
        )}
        {product.type === 'service' && (
          <span className="text-xs text-muted-foreground">Service</span>
        )}
      </div>

      {nearestExpiry && nearestExpiry.expiry_date && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground border-t border-border pt-2">
          <Calendar className="w-3 h-3" />
          <span>Expires {format(new Date(nearestExpiry.expiry_date), 'dd MMM yyyy')}</span>
        </div>
      )}
    </div>
  );
});

function StockHistorySheet({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { logs, isLoading } = useInventoryLogs(product.id);
  const { batches, isLoading: batchesLoading } = useProductBatches(product.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Stock Movement
          </SheetTitle>
          <SheetDescription>
            {product.name} — Current stock: <span className="font-semibold">{product.stock_quantity}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Batches Section */}
        {batches.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Batch & Expiry Tracking
            </h4>
            <div className="space-y-2">
              {batches.map((batch) => {
                const isExpired = batch.expiry_date && new Date(batch.expiry_date) <= new Date();
                const daysLeft = batch.expiry_date
                  ? Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <div key={batch.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{batch.batch_number}</p>
                      <p className="text-xs text-muted-foreground">Qty: {batch.quantity}</p>
                    </div>
                    <div className="text-right">
                      {batch.expiry_date ? (
                        <>
                          <Badge className={cn(
                            'text-xs',
                            isExpired
                              ? 'bg-destructive/10 text-destructive border-destructive/30'
                              : daysLeft !== null && daysLeft <= 30
                              ? 'bg-warning/10 text-warning border-warning/30'
                              : 'bg-muted text-muted-foreground'
                          )} variant="outline">
                            {isExpired ? 'Expired' : `${daysLeft}d left`}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(batch.expiry_date), 'dd MMM yyyy')}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No expiry</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Movement Logs */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold">Movement History</h4>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No stock movements recorded.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  {log.change_amount > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm truncate">{log.reason}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
                <span className={cn(
                  'font-mono text-sm font-medium shrink-0',
                  log.change_amount > 0 ? 'text-emerald-500' : 'text-destructive'
                )}>
                  {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                </span>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
