import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { computeItemAmount } from '@/utils/invoiceUtils';
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

const EMPTY_ARRAY: any[] = [];

export function useInvoices() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;
      
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

  const invoices = invoicesQuery.data || EMPTY_ARRAY;

  // Memoize computed stats
  const { totalRevenue, pendingAmount } = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    for (const inv of invoices) {
      const amount = Number(inv.grand_total);
      if (inv.status === 'paid') revenue += amount;
      else if (inv.status === 'finalized') pending += amount;
    }
    return { totalRevenue: revenue, pendingAmount: pending };
  }, [invoices]);

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      if (!profile?.id) throw new Error('No profile');
      
      const { data: invoiceNumber, error: numError } = await supabase
        .rpc('generate_invoice_number', { p_profile_id: profile.id });
      if (numError) throw numError;
      
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
          amount: computeItemAmount(item),
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
    mutationFn: async ({ id, formItems, ...updates }: Omit<Partial<Invoice>, 'items'> & { id: string; formItems?: InvoiceItemFormData[] }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (formItems) {
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        
        const newItems = formItems
          .filter(item => item.description && item.rate > 0)
          .map((item, index) => ({
            invoice_id: id,
            product_id: item.product_id || null,
            description: item.description,
            qty: item.qty,
            rate: item.rate,
            tax_rate: item.tax_rate,
            discount: item.discount,
            amount: computeItemAmount(item),
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
    mutationFn: async ({ invoiceId, paymentMode, paymentDate }: { invoiceId: string; paymentMode: PaymentMode; paymentDate?: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          payment_mode: paymentMode,
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
        })
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

  const getInvoiceWithItems = useCallback(async (invoiceId: string) => {
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .order('sort_order', { referencedTable: 'invoice_items', ascending: true })
      .single();
    
    if (invError) throw invError;
    return invoice;
  }, []);

  const generateId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

  const createInvoiceAsync = useCallback(async (data: { data: Omit<CreateInvoiceData, 'items'>; items: Omit<InvoiceItemFormData, 'id'>[] }) => {
    const itemsWithId = data.items.map(item => ({ 
      ...item, 
      id: generateId(),
    })) as InvoiceItemFormData[];
    
    return createInvoice.mutateAsync({
      ...data.data,
      items: itemsWithId,
    });
  }, [createInvoice]);

  const updateInvoiceAsync = useCallback(async (data: { id: string; data: Partial<Invoice>; items?: Omit<InvoiceItemFormData, 'id'>[] }) => {
    const itemsWithId = data.items?.map(item => ({ 
      ...item, 
      id: generateId(),
    })) as InvoiceItemFormData[] | undefined;
    
    const { items: _items, ...restData } = data.data;
    
    return updateInvoice.mutateAsync({
      id: data.id,
      ...restData,
      formItems: itemsWithId,
    });
  }, [updateInvoice]);

  const finalizeInvoiceAsync = useCallback(async (invoiceId: string) => {
    return finalizeInvoice.mutateAsync(invoiceId);
  }, [finalizeInvoice]);

  return useMemo(() => ({
    invoices,
    totalRevenue,
    pendingAmount,
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    createInvoice: createInvoiceAsync,
    updateInvoice: updateInvoiceAsync,
    finalizeInvoice: finalizeInvoiceAsync,
    finalizeInvoiceMutation: finalizeInvoice,
    isCreating: createInvoice.isPending,
    isUpdating: updateInvoice.isPending,
    isFinalizing: finalizeInvoice.isPending,
    markAsPaid,
    deleteInvoice,
    getInvoiceWithItems,
  }), [invoices, totalRevenue, pendingAmount, invoicesQuery.isLoading, invoicesQuery.error, createInvoiceAsync, updateInvoiceAsync, finalizeInvoiceAsync, finalizeInvoice, createInvoice.isPending, updateInvoice.isPending, finalizeInvoice.isPending, markAsPaid, deleteInvoice, getInvoiceWithItems]);
}
