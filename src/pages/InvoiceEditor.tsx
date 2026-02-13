import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Download,
  Mail,
  Loader2,
  Package,
  MessageCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceCalculations, formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import { GST_RATES, INDIAN_STATES } from '@/types';
import type { Client, Product, InvoiceItemFormData, Invoice, InvoiceItem } from '@/types';
import { InvoicePdfPreview } from '@/components/invoice/InvoicePdfPreview';
import { InlineClientCreate } from '@/components/invoice/InlineClientCreate';
import { InlineProductCreate } from '@/components/invoice/InlineProductCreate';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useInvoices } from '@/hooks/useInvoices';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { useSendInvoiceEmail } from '@/hooks/useSendInvoiceEmail';

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
import { useIsMobile } from '@/hooks/use-mobile';

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
          {/* Product search - full width on mobile */}
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

          {/* Qty, Rate, Tax - responsive grid */}
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
              <span>
                Only {selectedProduct?.stock_quantity} in stock!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoiceEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { profile } = useAuth();
  const isMobileView = useIsMobile();
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');

  // Database hooks
  const { clients, isLoading: clientsLoading } = useClients();
  const { products, isLoading: productsLoading } = useProducts();
  const { 
    invoices, 
    isLoading: invoicesLoading,
    createInvoice,
    updateInvoice,
    finalizeInvoice,
    isCreating,
    isUpdating,
    isFinalizing 
  } = useInvoices();

  const { generatePdf, isGenerating: isDownloading } = usePdfDownload();
  const { sendInvoiceEmail, isSending } = useSendInvoiceEmail();
  const { getInvoiceWithItems } = useInvoices();

  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [dateDue, setDateDue] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItemFormData[]>([createEmptyItem()]);
  const [clientOpen, setClientOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  // Profile state code
  const profileStateCode = profile?.state_code || '27';

  // Load existing invoice if editing
  useEffect(() => {
    if (!id) return;
    
    let cancelled = false;
    
    const loadInvoice = async () => {
      try {
        const fullInvoice = await getInvoiceWithItems(id);
        if (cancelled || !fullInvoice) return;
        
        setCurrentInvoice({
          ...fullInvoice,
          status: fullInvoice.status as 'draft' | 'finalized' | 'paid' | 'cancelled',
          payment_mode: fullInvoice.payment_mode as 'cash' | 'upi' | 'credit' | 'split' | null,
        });
        setInvoiceNumber(fullInvoice.invoice_number);
        setDateIssued(fullInvoice.date_issued);
        setDateDue(fullInvoice.date_due || '');
        setNotes(fullInvoice.notes || '');
        
        // Set client
        if (fullInvoice.client) {
          setSelectedClient(fullInvoice.client);
        }

        // Set items from invoice - sorted by sort_order
        if (fullInvoice.items && fullInvoice.items.length > 0) {
          const sortedItems = [...fullInvoice.items].sort((a: any, b: any) => a.sort_order - b.sort_order);
          setItems(sortedItems.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            description: item.description,
            qty: item.qty,
            rate: Number(item.rate),
            tax_rate: Number(item.tax_rate),
            discount: Number(item.discount),
          })));
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
      }
    };
    
    loadInvoice();
    
    return () => {
      cancelled = true;
    };
  }, [id, getInvoiceWithItems]);

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

  const handleSave = async () => {
    if (!profile) {
      toast({
        title: 'Error',
        description: 'Please complete your profile settings first.',
        variant: 'destructive',
      });
      return;
    }

    if (items.every(item => !item.description)) {
      toast({
        title: 'Error',
        description: 'Please add at least one item.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const invoiceData = {
        client_id: selectedClient?.id || null,
        date_issued: dateIssued,
        date_due: dateDue || null,
        notes: notes || null,
        subtotal: calculations.subtotal,
        total_tax: calculations.totalTax,
        total_discount: calculations.totalDiscount,
        grand_total: calculations.grandTotal,
        status: 'draft' as const,
      };

      const itemsData = items
        .filter(item => item.description)
        .map((item, index) => ({
          product_id: item.product_id,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          tax_rate: item.tax_rate,
          discount: item.discount,
          amount: item.qty * item.rate * (1 + item.tax_rate / 100) - item.discount,
          sort_order: index,
        }));

      if (id && currentInvoice) {
        await updateInvoice({ id, data: invoiceData, items: itemsData });
        toast({
          title: 'Invoice updated',
          description: 'Your invoice has been saved.',
        });
      } else {
        const newInvoice = await createInvoice({ data: invoiceData, items: itemsData });
        if (newInvoice) {
          setInvoiceNumber(newInvoice.invoice_number);
          setCurrentInvoice({
            ...newInvoice,
            status: newInvoice.status as 'draft' | 'finalized' | 'paid' | 'cancelled',
            payment_mode: newInvoice.payment_mode as 'cash' | 'upi' | 'credit' | 'split' | null,
          });
          navigate(`/invoices/${newInvoice.id}/edit`, { replace: true });
        }
        toast({
          title: 'Invoice created',
          description: 'Your invoice has been saved as a draft.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error saving invoice',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);

  const stockImpactItems = items
    .filter(item => item.product_id && item.description)
    .map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product || product.type !== 'goods') return null;
      return {
        name: product.name,
        currentStock: product.stock_quantity,
        deduction: item.qty,
        newStock: product.stock_quantity - item.qty,
        isNegative: product.stock_quantity - item.qty < 0,
      };
    })
    .filter(Boolean);

  const handleFinalizeClick = async () => {
    if (!currentInvoice) {
      // Save first, then open confirmation
      await handleSave();
      // After save, currentInvoice will be set via state update
      // We'll open the dialog after save completes
      toast({
        title: 'Invoice saved',
        description: 'Invoice saved as draft. Click Finalize again to confirm.',
      });
      return;
    }
    setFinalizeDialogOpen(true);
  };

  const handleFinalizeConfirm = async () => {
    if (!currentInvoice) return;
    setFinalizeDialogOpen(false);
    
    try {
      await finalizeInvoice(currentInvoice.id);
      toast({
        title: 'Invoice finalized',
        description: 'Invoice finalized and stock has been updated.',
      });
      navigate('/invoices');
    } catch (error: any) {
      toast({
        title: 'Error finalizing invoice',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!profile || !currentInvoice) {
      toast({
        title: 'Save invoice first',
        description: 'Please save the invoice before downloading.',
        variant: 'destructive',
      });
      return;
    }

    const invoiceItems: InvoiceItem[] = items
      .filter(item => item.description)
      .map((item, index) => ({
        id: item.id,
        invoice_id: currentInvoice.id,
        product_id: item.product_id,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount,
        amount: item.qty * item.rate * (1 + item.tax_rate / 100) - item.discount,
        sort_order: index,
        created_at: new Date().toISOString(),
      }));

    await generatePdf({
      invoice: currentInvoice,
      items: invoiceItems,
      client: selectedClient,
      profile,
    });
  };

  const handleSendEmail = async () => {
    if (!profile || !currentInvoice || !emailRecipient) {
      return;
    }

    const invoiceItems: InvoiceItem[] = items
      .filter(item => item.description)
      .map((item, index) => ({
        id: item.id,
        invoice_id: currentInvoice.id,
        product_id: item.product_id,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount,
        amount: item.qty * item.rate * (1 + item.tax_rate / 100) - item.discount,
        sort_order: index,
        created_at: new Date().toISOString(),
      }));

    const success = await sendInvoiceEmail({
      invoice: currentInvoice,
      items: invoiceItems,
      client: selectedClient,
      profile,
      recipientEmail: emailRecipient,
    });

    if (success) {
      setEmailDialogOpen(false);
      setEmailRecipient('');
    }
  };

  const isLoading = clientsLoading || productsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-border gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">
              {id ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {invoiceNumber || 'Will be generated on save'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {/* Preview toggle - hide on mobile (no split view) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2 hidden lg:flex"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          
          {currentInvoice && (
            <>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="md:hidden"
                title="Download PDF"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="gap-2 hidden md:flex"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setEmailRecipient(selectedClient?.email || '');
                  setEmailDialogOpen(true);
                }}
                className="hidden sm:flex md:hidden"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEmailRecipient(selectedClient?.email || '');
                  setEmailDialogOpen(true);
                }}
                className="gap-2 hidden md:flex"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const text = `Hi! Here's your invoice ${invoiceNumber} for ${formatINR(calculations.grandTotal)}. Please check and confirm.`;
                  const phone = selectedClient?.phone?.replace(/[^0-9]/g, '') || '';
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="gap-2 hidden md:flex"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleSave} 
            size="sm"
            className="gap-2"
            disabled={isSaving || isCreating || isUpdating}
          >
            {(isSaving || isCreating || isUpdating) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>
          
          <Button 
            onClick={handleFinalizeClick} 
            size="sm"
            className="gap-2"
            disabled={isFinalizing || !currentInvoice || currentInvoice?.status !== 'draft'}
          >
            {isFinalizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Finalize</span>
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 pt-4 md:pt-6 overflow-hidden">
        {showPreview && !isMobileView ? (
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
            {/* Editor Pane */}
            <ResizablePanel defaultSize={60} minSize={35}>
              <div className="h-full overflow-y-auto pr-4">
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
                          <PopoverContent className="w-[calc(100vw-4rem)] sm:w-96 p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search clients..." />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-2 space-y-2">
                                    <p className="text-sm text-muted-foreground">No client found.</p>
                                    <InlineClientCreate
                                      onCreated={(client) => {
                                        setSelectedClient(client);
                                        setClientOpen(false);
                                      }}
                                    />
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {clients.map((client) => (
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

                    {/* Header - hidden on mobile since labels are inline */}
                    <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
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
                              products={products}
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
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Preview Pane */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="h-full overflow-y-auto pl-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 h-full">
                  <InvoicePdfPreview
                    invoiceNumber={invoiceNumber || 'DRAFT'}
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
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full overflow-y-auto max-w-4xl mx-auto">
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
                      <PopoverContent className="w-[calc(100vw-4rem)] sm:w-96 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search clients..." />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2 space-y-2">
                                <p className="text-sm text-muted-foreground">No client found.</p>
                                <InlineClientCreate
                                  onCreated={(client) => {
                                    setSelectedClient(client);
                                    setClientOpen(false);
                                  }}
                                />
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
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

                {/* Header - hidden on mobile */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
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
                          products={products}
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
        )}
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice via Email</DialogTitle>
            <DialogDescription>
              Enter the recipient's email address to send the invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="client@example.com"
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending || !emailRecipient}>
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize Confirmation Dialog with Stock Impact */}
      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Invoice</DialogTitle>
            <DialogDescription>
              This will mark the invoice as sent and deduct stock for all goods items. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {stockImpactItems.length > 0 && (
            <div className="py-2">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Stock Impact
              </h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Current</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Deduct</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockImpactItems.map((item: any, idx: number) => (
                      <tr key={idx} className={cn('border-t border-border/50', item.isNegative && 'bg-destructive/5')}>
                        <td className="py-2 px-3 font-medium">{item.name}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{item.currentStock}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-destructive">-{item.deduction}</td>
                        <td className={cn('py-2 px-3 text-right tabular-nums font-semibold', item.isNegative ? 'text-destructive' : 'text-success')}>
                          {item.newStock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {stockImpactItems.some((item: any) => item.isNegative) && (
                <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Warning: Some products will go into negative stock!</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalizeConfirm} disabled={isFinalizing} className="gap-2">
              {isFinalizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Confirm & Finalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
