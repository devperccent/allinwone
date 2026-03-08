import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Send, Loader2, Plus, Trash2, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GST_RATES } from '@/types';
import type { InvoiceItemFormData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useToast } from '@/hooks/use-toast';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { generateId, computeItemAmount } from '@/utils/invoiceUtils';

interface POItemForm {
  id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
}

function createEmptyPOItem(): POItemForm {
  return { id: generateId(), product_id: null, description: '', qty: 1, rate: 0, tax_rate: 18 };
}

export default function PurchaseOrderEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { products } = useProducts();
  const { createPO, updatePO, getPOWithItems } = usePurchaseOrders();

  const [isSaving, setIsSaving] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItemForm[]>([createEmptyPOItem()]);
  const [poNumber, setPoNumber] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(id || null);
  const [currentStatus, setCurrentStatus] = useState('draft');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const po = await getPOWithItems(id);
        if (cancelled || !po) return;
        setPoNumber(po.po_number);
        setSupplierName(po.supplier_name);
        setSupplierGstin(po.supplier_gstin || '');
        setSupplierAddress(po.supplier_address || '');
        setDateIssued(po.date_issued);
        setExpectedDelivery(po.expected_delivery || '');
        setNotes(po.notes || '');
        setCurrentStatus(po.status);
        if (po.items && po.items.length > 0) {
          setItems(po.items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => ({
            id: item.id, product_id: item.product_id, description: item.description,
            qty: item.qty, rate: Number(item.rate), tax_rate: Number(item.tax_rate),
          })));
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { cancelled = true; };
  }, [id, getPOWithItems]);

  const updateItem = (itemId: string, updates: Partial<POItemForm>) =>
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  const removeItem = (itemId: string) => setItems(prev => prev.filter(i => i.id !== itemId));
  const addItem = () => setItems(prev => [...prev, createEmptyPOItem()]);

  // Calculate totals
  const totals = items.filter(i => i.description).reduce((acc, item) => {
    const base = item.qty * item.rate;
    const tax = base * (item.tax_rate / 100);
    return { subtotal: acc.subtotal + base, totalTax: acc.totalTax + tax, grandTotal: acc.grandTotal + base + tax };
  }, { subtotal: 0, totalTax: 0, grandTotal: 0 });

  const buildItems = () => items.filter(i => i.description).map((item, idx) => ({
    product_id: item.product_id, description: item.description, qty: item.qty,
    rate: item.rate, tax_rate: item.tax_rate,
    amount: item.qty * item.rate * (1 + item.tax_rate / 100), sort_order: idx,
  }));

  const handleSave = async () => {
    if (!profile) return;
    if (!supplierName.trim()) {
      toast({ title: 'Error', description: 'Supplier name is required.', variant: 'destructive' });
      return;
    }
    if (items.every(i => !i.description)) {
      toast({ title: 'Error', description: 'Add at least one item.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        supplier_name: supplierName,
        supplier_gstin: supplierGstin || null,
        supplier_address: supplierAddress || null,
        date_issued: dateIssued,
        expected_delivery: expectedDelivery || null,
        notes: notes || null,
        subtotal: totals.subtotal,
        total_tax: totals.totalTax,
        grand_total: totals.grandTotal,
      };
      if (currentId) {
        await updatePO.mutateAsync({ id: currentId, ...payload, items: buildItems() });
        toast({ title: 'PO updated' });
      } else {
        const po = await createPO.mutateAsync({ ...payload, items: buildItems() });
        setCurrentId(po.id);
        setPoNumber(po.po_number);
        navigate(`/purchase-orders/${po.id}/edit`, { replace: true });
        toast({ title: 'PO created' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handleMarkSent = async () => {
    if (!currentId) { await handleSave(); return; }
    try {
      await updatePO.mutateAsync({ id: currentId, status: 'sent' });
      setCurrentStatus('sent');
      toast({ title: 'PO marked as sent to supplier' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-border gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-orders')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold truncate">{id ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
            <p className="text-xs text-muted-foreground truncate">{poNumber || 'Will be generated on save'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={handleMarkSent} disabled={!currentId || currentStatus !== 'draft'}>
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send to Supplier</span>
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 pt-4 md:pt-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Supplier */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Supplier Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="po-supplier">Supplier Name *</Label>
                <Input id="po-supplier" value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Supplier / Vendor name" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="po-gstin">Supplier GSTIN</Label>
                <Input id="po-gstin" value={supplierGstin} onChange={e => setSupplierGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="po-addr">Supplier Address</Label>
                <Input id="po-addr" value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} placeholder="Address" className="mt-1.5" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Order Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="po-date">Order Date</Label>
                <Input id="po-date" type="date" value={dateIssued} onChange={e => setDateIssued(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="po-delivery">Expected Delivery</Label>
                <Input id="po-delivery" type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Line Items</h3>
            <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
              <div className="col-span-4">Product / Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate (₹)</div>
              <div className="col-span-2">Tax %</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1"></div>
            </div>
            <div className="space-y-3">
              {items.map((item) => {
                const itemAmount = item.qty * item.rate * (1 + item.tax_rate / 100);
                return (
                  <div key={item.id} className="p-3 rounded-lg border bg-card">
                     <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-center">
                       <div className="col-span-2 sm:col-span-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between font-normal text-sm">
                              <span className="truncate">{item.description || 'Select product...'}</span>
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search products..." />
                              <CommandList>
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                  {products.map(p => (
                                    <CommandItem key={p.id} value={p.name} onSelect={() => updateItem(item.id, { product_id: p.id, description: p.name, rate: p.selling_price, tax_rate: Number(p.tax_rate) })}>
                                      <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku} • {formatINR(p.selling_price)}</p></div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                       <div className="sm:col-span-2">
                         <label className="text-xs text-muted-foreground sm:hidden">Qty</label>
                         <Input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, { qty: parseInt(e.target.value) || 1 })} placeholder="Qty" />
                       </div>
                       <div className="sm:col-span-2">
                         <label className="text-xs text-muted-foreground sm:hidden">Rate (₹)</label>
                         <Input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })} placeholder="Rate" />
                       </div>
                       <div className="sm:col-span-2">
                         <label className="text-xs text-muted-foreground sm:hidden">Tax %</label>
                         <Select value={String(item.tax_rate)} onValueChange={v => updateItem(item.id, { tax_rate: parseInt(v) })}>
                           <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                           <SelectContent>
                             {GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="sm:col-span-1 text-sm font-medium tabular-nums flex items-center justify-between sm:justify-start">
                         <span className="sm:hidden text-xs text-muted-foreground">Total:</span>
                         {formatINR(itemAmount)}
                       </div>
                       <div className="sm:col-span-1 flex justify-end">
                         <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="text-muted-foreground hover:text-destructive">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" onClick={addItem} className="w-full mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add Line Item
            </Button>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST</span>
                <span className="font-medium tabular-nums">{formatINR(totals.totalTax)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-sm font-semibold">Grand Total</span>
                <span className="text-xl font-bold tabular-nums text-primary">{formatINR(totals.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-border bg-card p-4">
            <Label htmlFor="po-notes">Notes</Label>
            <Textarea id="po-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, special instructions..." className="mt-1.5" rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}