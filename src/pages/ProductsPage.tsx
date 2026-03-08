import { useState, useRef, useMemo } from 'react';
import { BarcodeScanButton } from '@/components/scanner/BarcodeScanner';
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

export default function ProductsPage() {
  const { products, isLoading, createProduct, deleteProduct } = useProducts();
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
  });

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Products & Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your products and track inventory levels
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
              <kbd className="ml-1 hidden sm:inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium text-primary-foreground/70">A</kbd>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Add a new product or service to your inventory.
              </DialogDescription>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div>
                  <Label htmlFor="customGst" className="text-sm font-medium cursor-pointer">Custom GST Rate</Label>
                  <p className="text-xs text-muted-foreground">Default is 18%. Toggle to set a different rate.</p>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createProduct.isPending || !formData.name || !formData.sku}
              >
                {createProduct.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Product'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">/</kbd>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 rounded-xl border border-border bg-card">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No products found</p>
            <Button variant="link" onClick={() => setIsAddDialogOpen(true)} className="mt-2">
              Add your first product
            </Button>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className={cn(
                'rounded-xl border bg-card p-5 transition-all hover:shadow-md',
                isLowStock(product) ? 'border-warning/50' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    {isLowStock(product) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {product.type === 'goods' && (
                      <DropdownMenuItem onClick={() => {
                        setSelectedProduct(product);
                        setStockSheetOpen(true);
                      }}>
                        <History className="w-4 h-4 mr-2" />
                        Stock History
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => deleteProduct.mutate(product.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {product.type === 'goods' ? 'Goods' : 'Service'}
                </Badge>
                {product.hsn_code && (
                  <Badge variant="outline" className="text-xs">
                    HSN: {product.hsn_code}
                  </Badge>
                )}
              </div>
              
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatINR(Number(product.selling_price))}</p>
                </div>
                {product.type === 'goods' && (
                  <div className="text-right">
                    <p className={cn(
                      'text-sm font-medium',
                      isLowStock(product) ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {product.stock_quantity} in stock
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Min: {product.low_stock_limit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stock History Sheet */}
      <StockHistorySheet
        product={selectedProduct}
        open={stockSheetOpen}
        onOpenChange={setStockSheetOpen}
      />
    </div>
  );
}

function StockHistorySheet({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { logs, isLoading } = useInventoryLogs(product?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Stock Movement
          </SheetTitle>
          <SheetDescription>
            {product?.name} — Current stock: <span className="font-semibold">{product?.stock_quantity}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No stock movement recorded yet</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className={cn(
                  'p-2 rounded-full',
                  log.change_amount < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                )}>
                  {log.change_amount < 0 ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {log.reason === 'invoice_deduction' ? 'Invoice Deduction' : log.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <span className={cn(
                  'text-sm font-semibold tabular-nums',
                  log.change_amount < 0 ? 'text-destructive' : 'text-success'
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
