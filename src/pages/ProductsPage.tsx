import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Package,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
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
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import type { Product, ProductType } from '@/types';
import { GST_RATES } from '@/types';

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    profile_id: '1',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    description: 'Ergonomic wireless mouse with USB receiver',
    type: 'goods',
    hsn_code: '8471',
    selling_price: 599,
    stock_quantity: 3,
    low_stock_limit: 10,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    profile_id: '1',
    name: 'USB-C Cable',
    sku: 'UC-001',
    description: 'USB-C to USB-C cable 1m',
    type: 'goods',
    hsn_code: '8544',
    selling_price: 299,
    stock_quantity: 5,
    low_stock_limit: 15,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '3',
    profile_id: '1',
    name: 'Mechanical Keyboard',
    sku: 'MK-001',
    description: 'RGB mechanical keyboard with blue switches',
    type: 'goods',
    hsn_code: '8471',
    selling_price: 2499,
    stock_quantity: 25,
    low_stock_limit: 5,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '4',
    profile_id: '1',
    name: 'Website Development',
    sku: 'SRV-WEB',
    description: 'Custom website development service',
    type: 'service',
    hsn_code: '998314',
    selling_price: 25000,
    stock_quantity: 0,
    low_stock_limit: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLowStock = (product: Product) =>
    product.type === 'goods' && product.stock_quantity <= product.low_stock_limit;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products & Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products and track inventory levels
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
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
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="e.g., Wireless Mouse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="e.g., WM-001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select defaultValue="goods">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Selling Price (₹)</Label>
                  <Input id="price" type="number" placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hsn">HSN/SAC Code</Label>
                  <Input id="hsn" placeholder="e.g., 8471" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input id="stock" type="number" placeholder="0" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lowStock">Low Stock Limit</Label>
                  <Input id="lowStock" type="number" placeholder="10" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>
                Add Product
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
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
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
                    <DropdownMenuItem>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                  <p className="text-2xl font-bold">{formatINR(product.selling_price)}</p>
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
    </div>
  );
}
