import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { useInvoiceCalculations, formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import { GST_RATES, INDIAN_STATES } from '@/types';
import type { Client, Product, InvoiceItemFormData } from '@/types';
import { InvoicePdfPreview } from '@/components/invoice/InvoicePdfPreview';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    profile_id: '1',
    name: 'ABC Enterprises',
    email: 'abc@example.com',
    phone: '9876543210',
    billing_address: '123, MG Road, Mumbai, Maharashtra 400001',
    gstin: '27AAAAA0000A1Z5',
    state_code: '27',
    credit_balance: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    profile_id: '1',
    name: 'XYZ Trading Co.',
    email: 'xyz@example.com',
    phone: '9876543211',
    billing_address: '456, Connaught Place, New Delhi 110001',
    gstin: '07BBBBB0000B1Z5',
    state_code: '07',
    credit_balance: 17200,
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
  },
];

const mockProducts: Product[] = [
  {
    id: '1',
    profile_id: '1',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    description: 'Ergonomic wireless mouse',
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
    stock_quantity: 50,
    low_stock_limit: 15,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '3',
    profile_id: '1',
    name: 'Mechanical Keyboard',
    sku: 'MK-001',
    description: 'RGB mechanical keyboard',
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
    description: 'Custom website development',
    type: 'service',
    hsn_code: '998314',
    selling_price: 25000,
    stock_quantity: 0,
    low_stock_limit: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const createEmptyItem = (): InvoiceItemFormData => ({
  id: generateId(),
  product_id: null,
  description: '',
  qty: 1,
  rate: 0,
  tax_rate: 18,
  discount: 0,
});

// Sortable Item Component
function SortableLineItem({
  item,
  index,
  onUpdate,
  onRemove,
  products,
  canRemove,
}: {
  item: InvoiceItemFormData;
  index: number;
  onUpdate: (id: string, updates: Partial<InvoiceItemFormData>) => void;
  onRemove: (id: string) => void;
  products: Product[];
  canRemove: boolean;
}) {
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
      tax_rate: 18,
    });
    setProductOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2 p-3 rounded-lg border bg-card',
        isDragging && 'opacity-50 shadow-lg',
        isLowStock && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <button
        type="button"
        className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 grid gap-3">
        <div className="grid grid-cols-12 gap-3">
          {/* Product Search */}
          <div className="col-span-5">
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
                  {item.description || 'Search product...'}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search products..." />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                      {products.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => handleProductSelect(product)}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku} • {formatINR(product.selling_price)}
                              {product.type === 'goods' && ` • Stock: ${product.stock_quantity}`}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Qty */}
          <div className="col-span-2">
            <Input
              type="number"
              min="1"
              value={item.qty}
              onChange={(e) => onUpdate(item.id, { qty: parseInt(e.target.value) || 1 })}
              className={cn(isLowStock && 'border-destructive')}
            />
          </div>

          {/* Rate */}
          <div className="col-span-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.rate}
              onChange={(e) => onUpdate(item.id, { rate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {/* Tax */}
          <div className="col-span-2">
            <Select
              value={String(item.tax_rate)}
              onValueChange={(v) => onUpdate(item.id, { tax_rate: parseInt(v) })}
            >
              <SelectTrigger>
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

          {/* Delete */}
          <div className="col-span-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              disabled={!canRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLowStock && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Only {selectedProduct?.stock_quantity} in stock!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoiceEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(true);

  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [dateDue, setDateDue] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItemFormData[]>([createEmptyItem()]);
  const [clientOpen, setClientOpen] = useState(false);

  // Profile (mock)
  const profileStateCode = '27'; // Maharashtra

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculations
  const calculations = useInvoiceCalculations({
    items,
    profileStateCode,
    clientStateCode: selectedClient?.state_code || null,
  });

  // Handlers
  const updateItem = (id: string, updates: Partial<InvoiceItemFormData>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    toast({
      title: 'Invoice saved',
      description: 'Your invoice has been saved as a draft.',
    });
  };

  const handleFinalize = () => {
    toast({
      title: 'Invoice finalized',
      description: 'Your invoice has been finalized and stock has been updated.',
    });
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Invoice</h1>
            <p className="text-sm text-muted-foreground">INW-0004</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button variant="outline" onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={handleFinalize} className="gap-2">
            <Send className="w-4 h-4" />
            Finalize & Send
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex gap-6 pt-6 overflow-hidden">
        {/* Editor Pane */}
        <div className={cn('flex-1 overflow-y-auto pr-2', !showPreview && 'max-w-4xl mx-auto')}>
          <div className="space-y-6">
            {/* Client Selection */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4">Client Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Select Client</Label>
                  <Popover open={clientOpen} onOpenChange={setClientOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between mt-1.5"
                      >
                        {selectedClient?.name || 'Select or add client...'}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {mockClients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => {
                                  setSelectedClient(client);
                                  setClientOpen(false);
                                }}
                              >
                                <div>
                                  <p className="font-medium">{client.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {client.email} • {INDIAN_STATES[client.state_code]}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedClient && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">GSTIN</Label>
                      <p className="font-medium">{selectedClient.gstin || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">State</Label>
                      <p className="font-medium">
                        {INDIAN_STATES[selectedClient.state_code]}
                        {selectedClient.state_code !== profileStateCode && (
                          <span className="ml-2 text-xs gst-badge gst-badge-igst">
                            IGST Applicable
                          </span>
                        )}
                        {selectedClient.state_code === profileStateCode && (
                          <span className="ml-2 text-xs gst-badge gst-badge-cgst">
                            CGST + SGST
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date-issued">Invoice Date</Label>
                  <Input
                    id="date-issued"
                    type="date"
                    value={dateIssued}
                    onChange={(e) => setDateIssued(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="date-due">Due Date</Label>
                  <Input
                    id="date-due"
                    type="date"
                    value={dateDue}
                    onChange={(e) => setDateDue(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold mb-4">Line Items</h3>

              {/* Header */}
              <div className="grid grid-cols-12 gap-3 px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
                <div className="col-span-5 pl-6">Product / Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Rate (₹)</div>
                <div className="col-span-2">Tax %</div>
                <div className="col-span-1"></div>
              </div>

              {/* Items */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <SortableLineItem
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                        products={mockProducts}
                        canRemove={items.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full mt-4 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </Button>
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">{formatINR(calculations.subtotal)}</span>
                </div>
                {calculations.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium tabular-nums text-success">
                      -{formatINR(calculations.totalDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {calculations.gstBreakdown.type === 'intra-state' ? (
                      <>
                        CGST ({formatINR(calculations.gstBreakdown.cgst)}) + SGST (
                        {formatINR(calculations.gstBreakdown.sgst)})
                      </>
                    ) : (
                      <>IGST</>
                    )}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatINR(calculations.totalTax)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-lg font-semibold">Grand Total</span>
                  <span className="text-2xl font-bold tabular-nums text-primary">
                    {formatINR(calculations.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-border bg-card p-5">
              <Label htmlFor="notes">Notes / Terms</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, bank details, etc."
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="w-[420px] flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
            <div className="h-full overflow-y-auto">
              <InvoicePdfPreview
                invoiceNumber="INW-0004"
                dateIssued={dateIssued}
                dateDue={dateDue}
                client={selectedClient}
                items={items}
                calculations={calculations}
                profileStateCode={profileStateCode}
                notes={notes}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
