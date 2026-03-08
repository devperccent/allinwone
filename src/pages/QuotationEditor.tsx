import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Send, Loader2, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { Search } from 'lucide-react';
import { INDIAN_STATES } from '@/types';
import type { Client, InvoiceItemFormData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useQuotations } from '@/hooks/useQuotations';
import { useInvoiceCalculations, formatINR } from '@/hooks/useInvoiceCalculations';
import { useToast } from '@/hooks/use-toast';
import { createEmptyItem, computeItemAmount } from '@/utils/invoiceUtils';
import { InlineClientCreate } from '@/components/invoice/InlineClientCreate';
import { SortableLineItem } from '@/components/invoice/SortableLineItem';
import { InvoiceTotals } from '@/components/invoice/InvoiceTotals';

export default function QuotationEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { clients } = useClients();
  const { products } = useProducts();
  const { createQuotation, updateQuotation, getQuotationWithItems } = useQuotations();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<InvoiceItemFormData[]>([createEmptyItem()]);
  const [quotationNumber, setQuotationNumber] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(id || null);
  const [currentStatus, setCurrentStatus] = useState('draft');

  const profileStateCode = profile?.state_code || '27';
  const calculations = useInvoiceCalculations({
    items, profileStateCode, clientStateCode: selectedClient?.state_code || null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const q = await getQuotationWithItems(id);
        if (cancelled || !q) return;
        setQuotationNumber(q.quotation_number);
        setDateIssued(q.date_issued);
        setValidUntil(q.valid_until || '');
        setNotes(q.notes || '');
        setTerms(q.terms || '');
        setCurrentStatus(q.status);
        if (q.client) setSelectedClient(q.client as Client);
        if (q.items && q.items.length > 0) {
          setItems(q.items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => ({
            id: item.id, product_id: item.product_id, description: item.description,
            qty: item.qty, rate: Number(item.rate), tax_rate: Number(item.tax_rate), discount: Number(item.discount),
          })));
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { cancelled = true; };
  }, [id, getQuotationWithItems]);

  const updateItem = (itemId: string, updates: Partial<InvoiceItemFormData>) =>
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  const removeItem = (itemId: string) => setItems(prev => prev.filter(i => i.id !== itemId));
  const addItem = () => setItems(prev => [...prev, createEmptyItem()]);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIdx = prev.findIndex(i => i.id === active.id);
        const newIdx = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const buildItems = () => items.filter(i => i.description).map((item, idx) => ({
    product_id: item.product_id, description: item.description, qty: item.qty,
    rate: item.rate, tax_rate: item.tax_rate, discount: item.discount,
    amount: computeItemAmount(item), sort_order: idx,
  }));

  const handleSave = async () => {
    if (!profile) return;
    if (items.every(i => !i.description)) {
      toast({ title: 'Error', description: 'Add at least one item.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        client_id: selectedClient?.id || null,
        date_issued: dateIssued,
        valid_until: validUntil || null,
        notes: notes || null,
        terms: terms || null,
        subtotal: calculations.subtotal,
        total_tax: calculations.totalTax,
        total_discount: calculations.totalDiscount,
        grand_total: calculations.grandTotal,
      };
      if (currentId) {
        await updateQuotation.mutateAsync({ id: currentId, ...payload, items: buildItems() });
        toast({ title: 'Quotation updated' });
      } else {
        const q = await createQuotation.mutateAsync({ ...payload, items: buildItems() });
        setCurrentId(q.id);
        setQuotationNumber(q.quotation_number);
        navigate(`/quotations/${q.id}/edit`, { replace: true });
        toast({ title: 'Quotation created' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkSent = async () => {
    if (!currentId) { await handleSave(); return; }
    try {
      await updateQuotation.mutateAsync({ id: currentId, status: 'sent' });
      setCurrentStatus('sent');
      toast({ title: 'Quotation marked as sent' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-border gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quotations')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold truncate">
              {id ? 'Edit Quotation' : 'New Quotation'}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {quotationNumber || 'Will be generated on save'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={handleMarkSent}
            disabled={!currentId || currentStatus !== 'draft'}>
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Mark Sent</span>
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 pt-4 md:pt-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Client */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold mb-4">Client Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Select Client</Label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between mt-1.5">
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
                            <InlineClientCreate onCreated={(c) => { setSelectedClient(c); setClientOpen(false); }} />
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {clients.map(c => (
                            <CommandItem key={c.id} value={c.name} onSelect={() => { setSelectedClient(c); setClientOpen(false); }}>
                              <div>
                                <p className="font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.email} • {INDIAN_STATES[c.state_code]}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <div className="border-t border-border p-1">
                          <InlineClientCreate onCreated={(c) => { setSelectedClient(c); setClientOpen(false); }} />
                        </div>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {selectedClient && (
                <>
                  <div><Label className="text-muted-foreground">GSTIN</Label><p className="font-medium">{selectedClient.gstin || 'Not provided'}</p></div>
                  <div><Label className="text-muted-foreground">State</Label><p className="font-medium">{INDIAN_STATES[selectedClient.state_code]}</p></div>
                </>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold mb-4">Quotation Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="q-date">Date</Label>
                <Input id="q-date" type="date" value={dateIssued} onChange={e => setDateIssued(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="q-valid">Valid Until</Label>
                <Input id="q-valid" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold mb-4">Line Items</h3>
            <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
              <div className="col-span-5 pl-6">Product / Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate (₹)</div>
              <div className="col-span-2">Tax %</div>
              <div className="col-span-1"></div>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <SortableLineItem key={item.id} item={item} index={idx} onUpdate={updateItem}
                      onRemove={removeItem} products={products} canRemove={items.length > 1} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button type="button" variant="outline" onClick={addItem} className="w-full mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add Line Item
            </Button>
          </div>

          <InvoiceTotals calculations={calculations} />

          {/* Notes & Terms */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <Label htmlFor="q-notes">Notes</Label>
              <Textarea id="q-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="mt-1.5" rows={2} />
            </div>
            <div>
              <Label htmlFor="q-terms">Terms & Conditions</Label>
              <Textarea id="q-terms" value={terms} onChange={e => setTerms(e.target.value)} placeholder="Payment terms, validity, etc." className="mt-1.5" rows={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}