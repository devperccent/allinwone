import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { computeItemAmount } from '@/utils/invoiceUtils';

export interface Quotation {
  id: string;
  profile_id: string;
  client_id: string | null;
  quotation_number: string;
  date_issued: string;
  valid_until: string | null;
  status: string;
  converted_invoice_id: string | null;
  subtotal: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  notes: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
    state_code: string;
  } | null;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  discount: number;
  tax_rate: number;
  amount: number;
  sort_order: number;
}

interface CreateQuotationData {
  client_id?: string | null;
  date_issued: string;
  valid_until?: string | null;
  notes?: string | null;
  terms?: string | null;
  subtotal: number;
  total_tax: number;
  total_discount: number;
  grand_total: number;
  items: Omit<QuotationItem, 'id' | 'quotation_id'>[];
}

const EMPTY_ARRAY: Quotation[] = [];

export function useQuotations() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quotationsQuery = useQuery({
    queryKey: ['quotations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;

      const { data, error } = await supabase
        .from('quotations')
        .select(`*, client:clients(id, name, email, state_code)`)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Quotation[];
    },
    enabled: !!profile?.id,
  });

  const createQuotation = useMutation({
    mutationFn: async (data: CreateQuotationData) => {
      if (!profile?.id) throw new Error('No profile');

      const prefix = (profile as any).quotation_prefix || 'QT-';
      const nextNum = (profile as any).next_quotation_number || 1;
      const quotationNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

      const { data: quotation, error: qError } = await supabase
        .from('quotations')
        .insert({
          profile_id: profile.id,
          client_id: data.client_id || null,
          quotation_number: quotationNumber,
          date_issued: data.date_issued,
          valid_until: data.valid_until || null,
          notes: data.notes || null,
          terms: data.terms || null,
          subtotal: data.subtotal,
          total_discount: data.total_discount,
          total_tax: data.total_tax,
          grand_total: data.grand_total,
          status: 'draft',
        })
        .select()
        .single();

      if (qError) throw qError;

      await supabase
        .from('profiles')
        .update({ next_quotation_number: nextNum + 1 })
        .eq('id', profile.id);

      if (data.items.length > 0) {
        const items = data.items.map((item, index) => ({
          quotation_id: quotation.id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: item.amount || computeItemAmount(item as any),
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Quotation created', description: 'Saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateQuotation = useMutation({
    mutationFn: async ({
      id,
      items,
      ...updates
    }: Partial<Omit<Quotation, 'items'>> & { id: string; items?: Omit<QuotationItem, 'id' | 'quotation_id'>[] }) => {
      const { data, error } = await supabase
        .from('quotations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (items) {
        await supabase.from('quotation_items').delete().eq('quotation_id', id);

        const newItems = items.map((item, index) => ({
          quotation_id: id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: item.amount || computeItemAmount(item as any),
          sort_order: index,
        }));

        if (newItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('quotation_items')
            .insert(newItems);
          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const convertToInvoice = useMutation({
    mutationFn: async (quotationId: string) => {
      const { data: quotation, error: qError } = await supabase
        .from('quotations')
        .select(`*, items:quotation_items(*)`)
        .eq('id', quotationId)
        .single();

      if (qError) throw qError;
      if (!profile?.id) throw new Error('No profile');

      const { data: invoiceNumber, error: numError } = await supabase.rpc(
        'generate_invoice_number',
        { p_profile_id: profile.id }
      );
      if (numError) throw numError;

      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          profile_id: profile.id,
          client_id: quotation.client_id,
          invoice_number: invoiceNumber,
          date_issued: new Date().toISOString().split('T')[0],
          subtotal: quotation.subtotal,
          total_discount: quotation.total_discount,
          total_tax: quotation.total_tax,
          grand_total: quotation.grand_total,
          notes: quotation.notes,
          status: 'draft',
        })
        .select()
        .single();

      if (invError) throw invError;

      if (quotation.items && quotation.items.length > 0) {
        const invoiceItems = quotation.items.map((item: any) => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: item.amount,
          sort_order: item.sort_order,
        }));

        await supabase.from('invoice_items').insert(invoiceItems);
      }

      await supabase
        .from('quotations')
        .update({ status: 'converted', converted_invoice_id: invoice.id })
        .eq('id', quotationId);

      return invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Converted to Invoice',
        description: `Invoice ${invoice.invoice_number} created.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getQuotationWithItems = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`*, client:clients(*), items:quotation_items(*)`)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'quotation_items', ascending: true })
      .single();

    if (error) throw error;
    return data as Quotation;
  }, []);

  const quotations = quotationsQuery.data || EMPTY_ARRAY;

  return useMemo(() => ({
    quotations,
    isLoading: quotationsQuery.isLoading,
    createQuotation,
    updateQuotation,
    convertToInvoice,
    deleteQuotation,
    getQuotationWithItems,
    isConverting: convertToInvoice.isPending,
  }), [quotations, quotationsQuery.isLoading, createQuotation, updateQuotation, convertToInvoice, deleteQuotation, getQuotationWithItems, convertToInvoice.isPending]);
}
