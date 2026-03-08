import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Truck, Loader2, Plus, Trash2, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search } from 'lucide-react';
import { INDIAN_STATES } from '@/types';
import type { Client } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useDeliveryChallans, ChallanItem } from '@/hooks/useDeliveryChallans';
import { useToast } from '@/hooks/use-toast';
import { InlineClientCreate } from '@/components/invoice/InlineClientCreate';
import { generateId } from '@/utils/invoiceUtils';

interface ChallanItemForm {
  id: string;
  product_id: string | null;
  description: string;
  qty: number;
}

function createEmptyChallanItem(): ChallanItemForm {
  return { id: generateId(), product_id: null, description: '', qty: 1 };
}

export default function ChallanEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { clients } = useClients();
  const { products } = useProducts();
  const { createChallan, updateChallan, getChallanWithItems } = useDeliveryChallans();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [transportMode, setTransportMode] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [dispatchFrom, setDispatchFrom] = useState('');
  const [dispatchTo, setDispatchTo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ChallanItemForm[]>([createEmptyChallanItem()]);
  const [challanNumber, setChallanNumber] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(id || null);
  const [currentStatus, setCurrentStatus] = useState('draft');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const c = await getChallanWithItems(id);
        if (cancelled || !c) return;
        setChallanNumber(c.challan_number);
        setDateIssued(c.date_issued);
        setTransportMode(c.transport_mode || '');
        setVehicleNumber(c.vehicle_number || '');
        setDispatchFrom(c.dispatch_from || '');
        setDispatchTo(c.dispatch_to || '');
        setNotes(c.notes || '');
        setCurrentStatus(c.status);
        if (c.client) setSelectedClient(c.client as Client);
        if (c.items && c.items.length > 0) {
          setItems(c.items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => ({
            id: item.id, product_id: item.product_id, description: item.description, qty: item.qty,
          })));
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { cancelled = true; };
  }, [id, getChallanWithItems]);

  const updateItem = (itemId: string, updates: Partial<ChallanItemForm>) =>
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  const removeItem = (itemId: string) => setItems(prev => prev.filter(i => i.id !== itemId));
  const addItem = () => setItems(prev => [...prev, createEmptyChallanItem()]);

  const buildItems = () => items.filter(i => i.description).map((item, idx) => ({
    product_id: item.product_id, description: item.description, qty: item.qty, sort_order: idx,
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
        transport_mode: transportMode || null,
        vehicle_number: vehicleNumber || null,
        dispatch_from: dispatchFrom || null,
        dispatch_to: dispatchTo || null,
        notes: notes || null,
      };
      if (currentId) {
        await updateChallan.mutateAsync({ id: currentId, ...payload, items: buildItems() });
        toast({ title: 'Challan updated' });
      } else {
        const c = await createChallan.mutateAsync({ ...payload, items: buildItems() });
        setCurrentId(c.id);
        setChallanNumber(c.challan_number);
        navigate(`/challans/${c.id}/edit`, { replace: true });
        toast({ title: 'Challan created' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handleDispatch = async () => {
    if (!currentId) { await handleSave(); return; }
    try {
      await updateChallan.mutateAsync({ id: currentId, status: 'dispatched' });
      setCurrentStatus('dispatched');
      toast({ title: 'Challan dispatched' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-border gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/challans')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold truncate">{id ? 'Edit Challan' : 'New Delivery Challan'}</h1>
            <p className="text-xs text-muted-foreground truncate">{challanNumber || 'Will be generated on save'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={handleDispatch} disabled={!currentId || currentStatus !== 'draft'}>
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Dispatch</span>
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 pt-4 md:pt-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Client */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Client Details</h3>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {selectedClient?.name || 'Select client...'}
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
                          <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{INDIAN_STATES[c.state_code]}</p></div>
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

          {/* Transport Details */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Transport Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-date">Date</Label>
                <Input id="c-date" type="date" value={dateIssued} onChange={e => setDateIssued(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="c-transport">Transport Mode</Label>
                <Input id="c-transport" value={transportMode} onChange={e => setTransportMode(e.target.value)} placeholder="Road / Rail / Air" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="c-vehicle">Vehicle Number</Label>
                <Input id="c-vehicle" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="MH 12 AB 1234" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="c-from">Dispatch From</Label>
                <Input id="c-from" value={dispatchFrom} onChange={e => setDispatchFrom(e.target.value)} placeholder="Warehouse address" className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-to">Dispatch To</Label>
                <Input id="c-to" value={dispatchTo} onChange={e => setDispatchTo(e.target.value)} placeholder="Delivery address" className="mt-1.5" />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Items</h3>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
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
                                  <CommandItem key={p.id} value={p.name} onSelect={() => updateItem(item.id, { product_id: p.id, description: p.name })}>
                                    <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku}</p></div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, { qty: parseInt(e.target.value) || 1 })} placeholder="Qty" />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addItem} className="w-full mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-border bg-card p-4">
            <Label htmlFor="c-notes">Notes</Label>
            <Textarea id="c-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="mt-1.5" rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}