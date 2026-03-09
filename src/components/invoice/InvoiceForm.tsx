import { Plus, Search } from 'lucide-react';
import type { InvoiceTemplate } from './invoiceTemplates';
import { TemplateSelector } from './TemplateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { INDIAN_STATES } from '@/types';
import type { Client, Product, InvoiceItemFormData } from '@/types';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { InlineClientCreate } from '@/components/invoice/InlineClientCreate';
import { SortableLineItem } from '@/components/invoice/SortableLineItem';
import { InvoiceTotals } from '@/components/invoice/InvoiceTotals';
import { FestivalDiscounts } from '@/components/invoice/FestivalDiscounts';
import { InvoiceTotals } from '@/components/invoice/InvoiceTotals';

interface InvoiceFormProps {
  clients: Client[];
  products: Product[];
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  clientOpen: boolean;
  onClientOpenChange: (open: boolean) => void;
  dateIssued: string;
  onDateIssuedChange: (v: string) => void;
  dateDue: string;
  onDateDueChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  items: InvoiceItemFormData[];
  onUpdateItem: (id: string, updates: Partial<InvoiceItemFormData>) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  calculations: {
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    grandTotal: number;
    gstBreakdown: { type: string; cgst: number; sgst: number; igst: number };
  };
  profileStateCode: string;
  showPaymentInfo: boolean;
  onShowPaymentInfoChange: (v: boolean) => void;
  paymentToggleId?: string;
  template?: InvoiceTemplate;
  onTemplateChange?: (t: InvoiceTemplate) => void;
}

export function InvoiceForm({
  clients,
  products,
  selectedClient,
  onSelectClient,
  clientOpen,
  onClientOpenChange,
  dateIssued,
  onDateIssuedChange,
  dateDue,
  onDateDueChange,
  notes,
  onNotesChange,
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onDragEnd,
  calculations,
  profileStateCode,
  showPaymentInfo,
  onShowPaymentInfoChange,
  paymentToggleId = 'paymentToggle',
  template = 'modern',
  onTemplateChange,
}: InvoiceFormProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Client Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Select Client</Label>
            <Popover open={clientOpen} onOpenChange={onClientOpenChange}>
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
                            onSelectClient(client);
                            onClientOpenChange(false);
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
                            onSelectClient(client);
                            onClientOpenChange(false);
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
                    <div className="border-t border-border p-1">
                      <InlineClientCreate
                        onCreated={(client) => {
                          onSelectClient(client);
                          onClientOpenChange(false);
                        }}
                      />
                    </div>
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
                    <span className="ml-2 text-xs gst-badge gst-badge-igst">IGST Applicable</span>
                  )}
                  {selectedClient.state_code === profileStateCode && (
                    <span className="ml-2 text-xs gst-badge gst-badge-cgst">CGST + SGST</span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Invoice Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="date-issued">Invoice Date</Label>
            <Input
              id="date-issued"
              type="date"
              value={dateIssued}
              onChange={(e) => onDateIssuedChange(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="date-due">Due Date</Label>
            <Input
              id="date-due"
              type="date"
              value={dateDue}
              onChange={(e) => onDateDueChange(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Line Items</h3>
          <FestivalDiscounts onApplyDiscount={(discount) => {
            items.forEach(item => onUpdateItem(item.id, { discount }));
          }} />
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
          <div className="col-span-5 pl-6">Product / Description</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Rate (₹)</div>
          <div className="col-span-2">Tax %</div>
          <div className="col-span-1"></div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableLineItem
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                  products={products}
                  canRemove={items.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button type="button" variant="outline" onClick={onAddItem} className="w-full mt-4 gap-2">
          <Plus className="w-4 h-4" />
          Add Line Item
        </Button>
      </div>

      {/* Totals */}
      <InvoiceTotals calculations={calculations} />

      {/* Notes */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label htmlFor="notes">Notes / Terms</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Payment terms, bank details, etc."
          className="mt-1.5"
          rows={3}
        />
      </div>

      {/* Payment Info Toggle */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <Label htmlFor={paymentToggleId} className="text-sm font-semibold">Show Payment Info</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Include bank details & UPI QR on the invoice</p>
        </div>
        <Switch
          id={paymentToggleId}
          checked={showPaymentInfo}
          onCheckedChange={onShowPaymentInfoChange}
        />
      </div>

      {/* Template Selector */}
      {onTemplateChange && (
        <div className="rounded-lg border border-border bg-card p-4">
          <TemplateSelector value={template} onChange={onTemplateChange} />
        </div>
      )}
    </div>
  );
}
