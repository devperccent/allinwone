import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceCalculations, formatINR } from '@/hooks/useInvoiceCalculations';
import type { Client, InvoiceItemFormData, Invoice, InvoiceItem } from '@/types';
import type { InvoiceTemplate } from '@/components/invoice/invoiceTemplates';
import { InvoiceEditorHeader } from '@/components/invoice/InvoiceEditorHeader';
import { InvoiceForm } from '@/components/invoice/InvoiceForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useInvoices } from '@/hooks/useInvoices';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { useSendInvoiceEmail } from '@/hooks/useSendInvoiceEmail';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useIsMobile } from '@/hooks/use-mobile';
import { createEmptyItem, computeItemAmount } from '@/utils/invoiceUtils';

// Lazy-load heavy components not needed for initial form render
const InvoicePdfPreview = lazy(() => import('@/components/invoice/InvoicePdfPreview').then(m => ({ default: m.InvoicePdfPreview })));
const ResizablePanelGroup = lazy(() => import('@/components/ui/resizable').then(m => ({ default: m.ResizablePanelGroup })));
const ResizablePanel = lazy(() => import('@/components/ui/resizable').then(m => ({ default: m.ResizablePanel })));
const ResizableHandle = lazy(() => import('@/components/ui/resizable').then(m => ({ default: m.ResizableHandle })));
const EmailDialog = lazy(() => import('@/components/invoice/EmailDialog').then(m => ({ default: m.EmailDialog })));
const FinalizeDialog = lazy(() => import('@/components/invoice/FinalizeDialog').then(m => ({ default: m.FinalizeDialog })));

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
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [template, setTemplate] = useState<InvoiceTemplate>('modern');

  // Database hooks
  const { clients, isLoading: clientsLoading } = useClients();
  const { products, isLoading: productsLoading } = useProducts();
  const {
    isLoading: invoicesLoading,
    createInvoice,
    updateInvoice,
    finalizeInvoice,
    isCreating,
    isUpdating,
    isFinalizing,
    getInvoiceWithItems,
  } = useInvoices();
  const { generatePdf, isGenerating: isDownloading } = usePdfDownload();
  const { sendInvoiceEmail, isSending } = useSendInvoiceEmail();

  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [dateDue, setDateDue] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItemFormData[]>([createEmptyItem()]);
  const [showPaymentInfo, setShowPaymentInfo] = useState(true);
  const [clientOpen, setClientOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

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

        if (fullInvoice.client) {
          setSelectedClient(fullInvoice.client);
        }

        if (fullInvoice.items && fullInvoice.items.length > 0) {
          const sortedItems = [...fullInvoice.items].sort((a: any, b: any) => a.sort_order - b.sort_order);
          setItems(
            sortedItems.map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              description: item.description,
              qty: item.qty,
              rate: Number(item.rate),
              tax_rate: Number(item.tax_rate),
              discount: Number(item.discount),
            }))
          );
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
      }
    };

    loadInvoice();
    return () => { cancelled = true; };
  }, [id, getInvoiceWithItems]);

  // Editor keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 's') { e.preventDefault(); handleSave(); return; }
      if (e.key === 'Enter') { e.preventDefault(); handleFinalizeClick(); return; }
      if (e.key === 'p' && !e.shiftKey) { e.preventDefault(); setShowPreview((prev) => !prev); return; }
      if (e.key === 'i') { e.preventDefault(); addItem(); return; }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  // Calculations
  const calculations = useInvoiceCalculations({
    items,
    profileStateCode,
    clientStateCode: selectedClient?.state_code || null,
  });

  // Handlers
  const updateItem = (id: string, updates: Partial<InvoiceItemFormData>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
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

  const buildItemsPayload = (items: InvoiceItemFormData[]) =>
    items
      .filter((item) => item.description)
      .map((item, index) => ({
        product_id: item.product_id,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount,
        amount: computeItemAmount(item),
        sort_order: index,
      }));

  const handleSave = async () => {
    if (!profile) {
      toast({ title: 'Error', description: 'Please complete your profile settings first.', variant: 'destructive' });
      return;
    }
    if (items.every((item) => !item.description)) {
      toast({ title: 'Error', description: 'Please add at least one item.', variant: 'destructive' });
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

      const itemsData = buildItemsPayload(items);

      if (id && currentInvoice) {
        await updateInvoice({ id, data: invoiceData, items: itemsData });
        toast({ title: 'Invoice updated', description: 'Your invoice has been saved.' });
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
        toast({ title: 'Invoice created', description: 'Your invoice has been saved as a draft.' });
      }
    } catch (error: any) {
      toast({ title: 'Error saving invoice', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const stockImpactItems = items
    .filter((item) => item.product_id && item.description)
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || product.type !== 'goods') return null;
      return {
        name: product.name,
        currentStock: product.stock_quantity,
        deduction: item.qty,
        newStock: product.stock_quantity - item.qty,
        isNegative: product.stock_quantity - item.qty < 0,
      };
    })
    .filter(Boolean) as { name: string; currentStock: number; deduction: number; newStock: number; isNegative: boolean }[];

  const handleFinalizeClick = async () => {
    if (!currentInvoice) {
      await handleSave();
      toast({ title: 'Invoice saved', description: 'Invoice saved as draft. Click Finalize again to confirm.' });
      return;
    }
    setFinalizeDialogOpen(true);
  };

  const handleFinalizeConfirm = async () => {
    if (!currentInvoice) return;
    setFinalizeDialogOpen(false);
    try {
      await finalizeInvoice(currentInvoice.id);
      toast({ title: 'Invoice finalized', description: 'Invoice finalized and stock has been updated.' });
      navigate('/invoices');
    } catch (error: any) {
      toast({ title: 'Error finalizing invoice', description: error.message, variant: 'destructive' });
    }
  };

  const buildInvoiceItems = (): InvoiceItem[] =>
    items
      .filter((item) => item.description)
      .map((item, index) => ({
        id: item.id,
        invoice_id: currentInvoice!.id,
        product_id: item.product_id,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount,
        amount: computeItemAmount(item),
        sort_order: index,
        created_at: new Date().toISOString(),
      }));

  const handleDownloadPdf = async () => {
    if (!profile || !currentInvoice) {
      toast({ title: 'Save invoice first', description: 'Please save the invoice before downloading.', variant: 'destructive' });
      return;
    }
    await generatePdf({
      invoice: currentInvoice,
      items: buildInvoiceItems(),
      client: selectedClient,
      profile,
      showPaymentInfo,
      template,
    });
  };

  const handleSendEmail = async () => {
    if (!profile || !currentInvoice || !emailRecipient) return;
    const success = await sendInvoiceEmail({
      invoice: currentInvoice,
      items: buildInvoiceItems(),
      client: selectedClient,
      profile,
      recipientEmail: emailRecipient,
      showPaymentInfo,
    });
    if (success) {
      setEmailDialogOpen(false);
      setEmailRecipient('');
    }
  };

  const handleWhatsAppClick = async () => {
    let token: string | null = null;
    if (id) {
      const { data: inv } = await supabase.from('invoices').select('share_token').eq('id', id).single();
      token = inv?.share_token || null;
      if (!token) {
        const { data, error } = await supabase.rpc('generate_share_token');
        if (error) { console.error(error); return; }
        token = data;
        await supabase.from('invoices').update({ share_token: token }).eq('id', id);
      }
    }
    const link = token ? `${window.location.origin}/invoice/view?token=${token}` : '';
    const text = `Hi! Here's your invoice ${invoiceNumber} for ${formatINR(calculations.grandTotal)}.${link ? ` View it here: ${link}` : ''}`;
    const phone = selectedClient?.phone?.replace(/[^0-9]/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isLoading = clientsLoading || productsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formProps = {
    clients,
    products,
    selectedClient,
    onSelectClient: setSelectedClient,
    clientOpen,
    onClientOpenChange: setClientOpen,
    dateIssued,
    onDateIssuedChange: setDateIssued,
    dateDue,
    onDateDueChange: setDateDue,
    notes,
    onNotesChange: setNotes,
    items,
    onUpdateItem: updateItem,
    onRemoveItem: removeItem,
    onAddItem: addItem,
    onDragEnd: handleDragEnd,
    calculations,
    profileStateCode,
    showPaymentInfo,
    onShowPaymentInfoChange: setShowPaymentInfo,
    template,
    onTemplateChange: setTemplate,
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      <InvoiceEditorHeader
        id={id}
        invoiceNumber={invoiceNumber}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onBack={() => navigate('/invoices')}
        onSave={handleSave}
        onFinalize={handleFinalizeClick}
        onDownloadPdf={handleDownloadPdf}
        onEmailClick={() => {
          setEmailRecipient(selectedClient?.email || '');
          setEmailDialogOpen(true);
        }}
        onWhatsAppClick={handleWhatsAppClick}
        isSaving={isSaving}
        isCreating={isCreating}
        isUpdating={isUpdating}
        isFinalizing={isFinalizing}
        isDownloading={isDownloading}
        hasCurrentInvoice={!!currentInvoice}
        isDraft={currentInvoice?.status === 'draft'}
      />

      {/* Split View */}
      <div className="flex-1 pt-4 md:pt-6 overflow-hidden">
        {/* Mobile: Tabs for Form / Preview */}
        {isMobileView ? (
          <Tabs defaultValue="form" className="h-full flex flex-col">
            <TabsList className="mx-auto mb-3 shrink-0">
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="flex-1 overflow-y-auto mt-0">
              <div className="max-w-4xl mx-auto">
                <InvoiceForm {...formProps} paymentToggleId="paymentToggleMobile" />
              </div>
            </TabsContent>
            <TabsContent value="preview" className="flex-1 overflow-y-auto mt-0">
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
                  profile={profile}
                  status={currentInvoice?.status || 'draft'}
                  showPaymentInfo={showPaymentInfo}
                  template={template}
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : showPreview ? (
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
            <ResizablePanel defaultSize={60} minSize={35}>
              <div className="h-full overflow-y-auto pr-4">
                <InvoiceForm {...formProps} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="h-full overflow-y-auto pl-4">
                <div className="rounded-xl border border-border bg-muted/30 p-3 h-full overflow-hidden">
                  <InvoicePdfPreview
                    invoiceNumber={invoiceNumber || 'DRAFT'}
                    dateIssued={dateIssued}
                    dateDue={dateDue}
                    client={selectedClient}
                    items={items}
                    calculations={calculations}
                    profileStateCode={profileStateCode}
                    notes={notes}
                    profile={profile}
                    status={currentInvoice?.status || 'draft'}
                    showPaymentInfo={showPaymentInfo}
                    template={template}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full overflow-y-auto max-w-4xl mx-auto">
            <InvoiceForm {...formProps} paymentToggleId="paymentToggleMobile" />
          </div>
        )}
      </div>

      <EmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        emailRecipient={emailRecipient}
        onEmailRecipientChange={setEmailRecipient}
        onSend={handleSendEmail}
        isSending={isSending}
      />

      <FinalizeDialog
        open={finalizeDialogOpen}
        onOpenChange={setFinalizeDialogOpen}
        onConfirm={handleFinalizeConfirm}
        isFinalizing={isFinalizing}
        stockImpactItems={stockImpactItems}
      />
    </div>
  );
}
