import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Loader2, Plus, Trash2, Search } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { usePurchaseBills } from '@/hooks/usePurchaseBills';
import { useToast } from '@/hooks/use-toast';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { BarcodeScanButton } from '@/components/scanner/BarcodeScanner';

interface BillItemForm {
  id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
  batch_number: string;
  expiry_date: string;
}

let _itemId = 0;
function createEmptyItem(): BillItemForm {
  return { id: `new-${++_itemId}`, product_id: null, description: '', qty: 1, rate: 0, tax_rate: 18, batch_number: '', expiry_date: '' };
}

export default function PurchaseBillEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { products } = useProducts();
  const { createBill, updateBill, finalizeBill, getBillWithItems } = usePurchaseBills();

  const [isSaving, setIsSaving] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedDate, setReceivedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BillItemForm[]>([createEmptyItem()]);
  const [currentId, setCurrentId] = useState<string | null>(id || null);
  const [currentStatus, setCurrentStatus] = useState('draft');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const bill = await getBillWithItems(id);
        if (cancelled || !bill) return;
        setSupplierName(bill.supplier_name);
        setSupplierGstin(bill.supplier_gstin || '');
        setSupplierAddress(bill.supplier_address || '');
        setBillNumber(bill.bill_number);
        setBillDate(bill.bill_date);
        setReceivedDate(bill.received_date || '');
        setNotes(bill.notes || '');
        setCurrentStatus(bill.status);
        if (bill.items && bill.items.length > 0) {
          setItems(bill.items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => ({
            id: item.id, product_id: item.product_id, description: item.description,
            qty: Number(item.qty), rate: Number(item.rate), tax_rate: Number(item.tax_rate),
            batch_number: item.batch_number || '', expiry_date: item.expiry_date || '',
          })));
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { cancelled = true; };
  }, [id, getBillWithItems]);

  const updateItem = (itemId: string, updates: Partial<BillItemForm>) =>
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  const removeItem = (itemId: string) => setItems(prev => prev.filter(i => i.id !== itemId));
  const addItem = () => setItems(prev => [...prev, createEmptyItem()]);

  const handleBarcodeScan = (code: string) => {
    const product = products.find(p => (p as any).barcode === code || p.sku === code);
    if (product) {
      const emptyItem = items.find(i => !i.description);
      if (emptyItem) {
        updateItem(emptyItem.id, {
          product_id: product.id, description: product.name,
          rate: product.selling_price, tax_rate: Number(product.tax_rate),
        });
      } else {
        setItems(prev => [...prev, {
          ...createEmptyItem(), product_id: product.id, description: product.name,
          rate: product.selling_price, tax_rate: Number(product.tax_rate),
        }]);
      }
      toast({ title: 'Product found', description: product.name });
    } else {
      toast({ title: 'Product not found', description: `No product with barcode "${code}"`, variant: 'destructive' });
    }
  };

  const totals = items.filter(i => i.description).reduce((acc, item) => {
    const base = item.qty * item.rate;
    const tax = base * (item.tax_rate / 100);
    return { subtotal: acc.subtotal + base, totalTax: acc.totalTax + tax, grandTotal: acc.grandTotal + base + tax };
  }, { subtotal: 0, totalTax: 0, grandTotal: 0 });

  const buildItems = () => items.filter(i => i.description).map((item, idx) => ({
    product_id: item.product_id, description: item.description, qty: item.qty,
    rate: item.rate, tax_rate: item.tax_rate,
    amount: item.qty * item.rate * (1 + item.tax_rate / 100), sort_order: idx,
    batch_number: item.batch_number || null, expiry_date: item.expiry_date || null,
  }));

  const handleSave = async () => {
    if (!profile) return;
    if (!supplierName.trim()) { toast({ title: 'Error', description: 'Supplier name required.', variant: 'destructive' }); return; }
    if (!billNumber.trim()) { toast({ title: 'Error', description: 'Bill number required.', variant: 'destructive' }); return; }
    if (items.every(i => !i.description)) { toast({ title: 'Error', description: 'Add at least one item.', variant: 'destructive' }); return; }
    setIsSaving(true);
    try {
      const payload = {
        supplier_name: supplierName, supplier_gstin: supplierGstin || null,
        supplier_address: supplierAddress || null, bill_number: billNumber,
        bill_date: billDate, received_date: receivedDate || null,
        notes: notes || null, subtotal: totals.subtotal, total_tax: totals.totalTax, grand_total: totals.grandTotal,
      };
      if (currentId) {
        await updateBill.mutateAsync({ id: currentId, ...payload, items: buildItems() });
        toast({ title: 'Bill updated' });
      } else {
        const bill = await createBill.mutateAsync({ ...payload, items: buildItems() });
        setCurrentId(bill.id);
        navigate(`/purchase-bills/${bill.id}/edit`, { replace: true });
        toast({ title: 'Bill created' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handleFinalize = async () => {
    if (!currentId) { await handleSave(); return; }
    finalizeBill.mutate(currentId, { onSuccess: () => setCurrentStatus('received') });
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-border gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-bills')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold truncate">{id ? 'Edit Purchase Bill' : 'New Purchase Bill'}</h1>
            <p className="text-xs text-muted-foreground truncate">{billNumber || 'Enter supplier bill number'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BarcodeScanButton onScan={handleBarcodeScan} />
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={handleFinalize} disabled={!currentId || currentStatus !== 'draft' || finalizeBill.isPending}>
            {finalizeBill.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span className="hidden sm:inline">Receive Stock</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 pt-4 md:pt-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Supplier */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Supplier Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Supplier Name *</Label>
                <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Supplier name" className="mt-1.5" />
              </div>
              <div>
                <Label>Supplier GSTIN</Label>
                <Input value={supplierGstin} onChange={e => setSupplierGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" className="mt-1.5" />
              </div>
              <div>
                <Label>Supplier Address</Label>
                <Input value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} placeholder="Address" className="mt-1.5" />
              </div>
            </div>
          </div>

          {/* Bill Details */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Bill Details</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Bill Number *</Label>
                <Input value={billNumber} onChange={e => setBillNumber(e.target.value)} placeholder="Supplier bill #" className="mt-1.5" />
              </div>
              <div>
                <Label>Bill Date</Label>
                <Input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Received Date</Label>
                <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Line Items</h3>
            <div className="space-y-3">
              {items.map((item) => {
                const itemAmount = item.qty * item.rate * (1 + item.tax_rate / 100);
                return (
                  <div key={item.id} className="p-3 rounded-lg border bg-card space-y-3">
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
                        <Input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, { qty: parseInt(e.target.value) || 1 })} placeholder="Qty" />
                      </div>
                      <div className="sm:col-span-2">
                        <Input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })} placeholder="Rate" />
                      </div>
                      <div className="sm:col-span-2">
                        <Select value={String(item.tax_rate)} onValueChange={v => updateItem(item.id, { tax_rate: parseInt(v) })}>
                          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-1 text-sm font-medium tabular-nums">{formatINR(itemAmount)}</div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {/* Batch & Expiry Row */}
                    <div className="grid grid-cols-2 gap-3 pl-0 sm:pl-0">
                      <div>
                        <Label className="text-xs text-muted-foreground">Batch Number</Label>
                        <Input value={item.batch_number} onChange={e => updateItem(item.id, { batch_number: e.target.value })} placeholder="e.g., BATCH-001" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                        <Input type="date" value={item.expiry_date} onChange={e => updateItem(item.id, { expiry_date: e.target.value })} className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" onClick={addItem} className="w-full mt-4 gap-2"><Plus className="w-4 h-4" /> Add Line Item</Button>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium tabular-nums">{formatINR(totals.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST</span><span className="font-medium tabular-nums">{formatINR(totals.totalTax)}</span></div>
              <div className="border-t border-border pt-3 flex justify-between"><span className="text-sm font-semibold">Grand Total</span><span className="text-xl font-bold tabular-nums text-primary">{formatINR(totals.grandTotal)}</span></div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-card p-5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, special instructions..." className="mt-1.5" rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
