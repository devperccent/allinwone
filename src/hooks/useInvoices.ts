import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Invoice, InvoiceItem, InvoiceItemFormData, PaymentMode } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateInvoiceData {
  client_id?: string | null;
  date_issued: string;
  date_due?: string | null;
  payment_mode?: PaymentMode | null;
  notes?: string | null;
  subtotal: number;
  total_tax: number;
  total_discount: number;
  grand_total: number;
  items: InvoiceItemFormData[];
}

export function useInvoices() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Invoice & { client: Invoice['client'] })[];
    },
    enabled: !!profile?.id,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      if (!profile?.id) throw new Error('No profile');
      
      // Generate invoice number
      const { data: invoiceNumber, error: numError } = await supabase
        .rpc('generate_invoice_number', { p_profile_id: profile.id });
      
      if (numError) throw numError;
      
      // Create invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          profile_id: profile.id,
          client_id: invoiceData.client_id || null,
          invoice_number: invoiceNumber,
          date_issued: invoiceData.date_issued,
          date_due: invoiceData.date_due || null,
          payment_mode: invoiceData.payment_mode || null,
          notes: invoiceData.notes || null,
          subtotal: invoiceData.subtotal,
          total_tax: invoiceData.total_tax,
          total_discount: invoiceData.total_discount,
          grand_total: invoiceData.grand_total,
          status: 'draft',
        })
        .select()
        .single();
      
      if (invError) throw invError;
      
      // Create invoice items
      const items = invoiceData.items
        .filter(item => item.description && item.rate > 0)
        .map((item, index) => ({
          invoice_id: invoice.id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          tax_rate: item.tax_rate,
          discount: item.discount,
          amount: item.qty * item.rate,
          sort_order: index,
        }));
      
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);
        
        if (itemsError) throw itemsError;
      }
      
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Invoice created', description: 'Invoice saved as draft.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, items, ...updates }: Partial<Invoice> & { id: string; items?: InvoiceItemFormData[] }) => {
      // Update invoice
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update items if provided
      if (items) {
        // Delete existing items
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        
        // Insert new items
        const newItems = items
          .filter(item => item.description && item.rate > 0)
          .map((item, index) => ({
            invoice_id: id,
            product_id: item.product_id || null,
            description: item.description,
            qty: item.qty,
            rate: item.rate,
            tax_rate: item.tax_rate,
            discount: item.discount,
            amount: item.qty * item.rate,
            sort_order: index,
          }));
        
        if (newItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(newItems);
          
          if (itemsError) throw itemsError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const finalizeInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .rpc('finalize_invoice', { p_invoice_id: invoiceId });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ 
        title: 'Invoice finalized', 
        description: 'Invoice sent and stock updated.',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ invoiceId, paymentMode }: { invoiceId: string; paymentMode: PaymentMode }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'paid', payment_mode: paymentMode })
        .eq('id', invoiceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice marked as paid' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getInvoiceWithItems = async (invoiceId: string) => {
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();
    
    if (invError) throw invError;
    return invoice;
  };

  // Stats
  const totalRevenue = invoicesQuery.data
    ?.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0;

  const pendingAmount = invoicesQuery.data
    ?.filter(inv => inv.status === 'finalized')
    .reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0;

  return {
    invoices: invoicesQuery.data || [],
    totalRevenue,
    pendingAmount,
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    createInvoice,
    updateInvoice,
    finalizeInvoice,
    markAsPaid,
    deleteInvoice,
    getInvoiceWithItems,
  };
}
