import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  MessageCircle,
  Printer,
  Check,
  X,
  Scan,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts } from '@/hooks/useProducts';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Product, PaymentMode } from '@/types';

interface CartItem {
  product: Product;
  qty: number;
}

const paymentModes: { value: PaymentMode | 'card'; label: string; icon: React.ElementType }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'credit', label: 'Udhar', icon: Wallet },
];

export default function QuickBillPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { createInvoice, finalizeInvoice, isCreating, isFinalizing } = useInvoices();

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMode | 'card'>('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.hsn_code?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Cart calculations
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    cart.forEach((item) => {
      const itemTotal = item.qty * item.product.selling_price;
      const tax = itemTotal * (item.product.tax_rate / 100);
      subtotal += itemTotal;
      totalTax += tax;
    });

    return {
      subtotal,
      totalTax,
      grandTotal: subtotal + totalTax,
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
    };
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, qty: Math.max(0, item.qty + delta) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSearchQuery('');
    searchRef.current?.focus();
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !profile) return;

    try {
      // Create invoice items
      const items = cart.map((item) => ({
        product_id: item.product.id,
        description: item.product.name,
        qty: item.qty,
        rate: item.product.selling_price,
        tax_rate: item.product.tax_rate,
        discount: 0,
      }));

      // Create and immediately finalize
      const invoice = await createInvoice({
        data: {
          client_id: null, // Walk-in customer
          date_issued: new Date().toISOString().split('T')[0],
          date_due: null,
          payment_mode: selectedPayment === 'card' ? 'upi' : selectedPayment,
          notes: 'Quick Bill',
          subtotal: cartTotals.subtotal,
          total_tax: cartTotals.totalTax,
          total_discount: 0,
          grand_total: cartTotals.grandTotal,
        },
        items,
      });

      // Finalize the invoice
      await finalizeInvoice(invoice.id);

      setLastInvoiceNumber(invoice.invoice_number);
      setShowSuccess(true);

      // Auto-close success and reset
      setTimeout(() => {
        setShowSuccess(false);
        clearCart();
      }, 3000);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handleWhatsAppShare = () => {
    if (!lastInvoiceNumber) return;
    const text = `Thank you for your purchase!\nBill: ${lastInvoiceNumber}\nAmount: ${formatINR(cartTotals.grandTotal)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <Check className="w-12 h-12 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Payment Received!</h2>
            <p className="text-muted-foreground mt-1">Bill {lastInvoiceNumber}</p>
            <p className="text-3xl font-bold mt-4">{formatINR(cartTotals.grandTotal)}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="lg" onClick={handleWhatsAppShare} className="gap-2">
              <MessageCircle className="w-5 h-5" />
              Share on WhatsApp
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Printer className="w-5 h-5" />
              Print Receipt
            </Button>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setShowSuccess(false);
              clearCart();
            }}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            New Bill
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 animate-fade-in overflow-hidden">
      {/* Main Content - Product Grid + Cart */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Quick Bill</h1>
            <p className="text-sm text-muted-foreground">Tap products to add</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search products or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-12 text-lg"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => toast({ title: 'Barcode Scanner', description: 'Coming soon!' })}
          >
            <Scan className="w-5 h-5" />
          </Button>
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id);
              const isLowStock = product.type === 'goods' && product.stock_quantity <= product.low_stock_limit;

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'relative p-4 rounded-xl border bg-card text-left transition-all hover:border-primary hover:shadow-md active:scale-95',
                    inCart && 'border-primary bg-primary/5'
                  )}
                >
                  {inCart && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center rounded-full">
                      {inCart.qty}
                    </Badge>
                  )}
                  <p className="font-medium text-sm line-clamp-2 mb-2">{product.name}</p>
                  <p className="text-lg font-bold">{formatINR(product.selling_price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                    {isLowStock && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        Low
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Sidebar */}
      <Card className="w-full lg:w-96 flex flex-col min-h-0 lg:h-full">
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          {/* Cart Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-semibold">Cart</span>
              {cart.length > 0 && (
                <Badge variant="secondary">{cartTotals.itemCount} items</Badge>
              )}
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                Clear
              </Button>
            )}
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 -mx-4 px-4">
            {cart.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p className="text-center">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Cart is empty
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatINR(item.product.selling_price)} × {item.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.product.id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.product.id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totals */}
          {cart.length > 0 && (
            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatINR(cartTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST</span>
                <span>{formatINR(cartTotals.totalTax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatINR(cartTotals.grandTotal)}</span>
              </div>
            </div>
          )}

          {/* Payment Mode Selection */}
          {cart.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Payment Mode</p>
              <div className="grid grid-cols-4 gap-2">
                {paymentModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedPayment(mode.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                      selectedPayment === mode.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <mode.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <Button
            size="lg"
            className="w-full mt-4 h-14 text-lg gap-2"
            disabled={cart.length === 0 || isCreating || isFinalizing}
            onClick={handleCheckout}
          >
            {isCreating || isFinalizing ? (
              <>Processing...</>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Charge {formatINR(cartTotals.grandTotal)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
