import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { computeItemAmount } from '@/utils/invoiceUtils';
import { addWeeks, addMonths, addYears } from 'date-fns';

export interface RecurringTemplate {
  id: string;
  profile_id: string;
  client_id: string;
  template_name: string;
  frequency: string;
  next_generate_date: string;
  is_active: boolean;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
    state_code: string;
  } | null;
  items?: RecurringTemplateItem[];
}

export interface RecurringTemplateItem {
  id: string;
  template_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  discount: number;
  tax_rate: number;
  amount: number;
  sort_order: number;
}

interface CreateTemplateData {
  client_id: string;
  template_name: string;
  frequency: string;
  next_generate_date: string;
  notes?: string | null;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  items: Omit<RecurringTemplateItem, 'id' | 'template_id'>[];
}

export function useRecurringTemplates() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['recurring_templates', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('recurring_templates')
        .select(`*, client:clients(id, name, email, state_code)`)
        .eq('profile_id', profile.id)
        .order('next_generate_date', { ascending: true });

      if (error) throw error;
      return data as RecurringTemplate[];
    },
    enabled: !!profile?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      if (!profile?.id) throw new Error('No profile');

      const { data: template, error: tError } = await supabase
        .from('recurring_templates')
        .insert({
          profile_id: profile.id,
          client_id: data.client_id,
          template_name: data.template_name,
          frequency: data.frequency,
          next_generate_date: data.next_generate_date,
          notes: data.notes || null,
          subtotal: data.subtotal,
          total_tax: data.total_tax,
          grand_total: data.grand_total,
          is_active: true,
        })
        .select()
        .single();

      if (tError) throw tError;

      if (data.items.length > 0) {
        const items = data.items.map((item, index) => ({
          template_id: template.id,
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
          .from('recurring_template_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_templates'] });
      toast({ title: 'Template created', description: 'Recurring invoice template saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      items,
      ...updates
    }: Partial<RecurringTemplate> & { id: string; items?: Omit<RecurringTemplateItem, 'id' | 'template_id'>[] }) => {
      const { data, error } = await supabase
        .from('recurring_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (items) {
        await supabase.from('recurring_template_items').delete().eq('template_id', id);

        const newItems = items.map((item, index) => ({
          template_id: id,
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
            .from('recurring_template_items')
            .insert(newItems);
          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_templates'] });
      toast({ title: 'Template updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const generateInvoice = useMutation({
    mutationFn: async (templateId: string) => {
      // Get template with items
      const { data: template, error: tError } = await supabase
        .from('recurring_templates')
        .select(`*, items:recurring_template_items(*)`)
        .eq('id', templateId)
        .single();

      if (tError) throw tError;
      if (!profile?.id) throw new Error('No profile');

      // Generate invoice number
      const { data: invoiceNumber, error: numError } = await supabase.rpc(
        'generate_invoice_number',
        { p_profile_id: profile.id }
      );
      if (numError) throw numError;

      // Create invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          profile_id: profile.id,
          client_id: template.client_id,
          invoice_number: invoiceNumber,
          date_issued: new Date().toISOString().split('T')[0],
          subtotal: template.subtotal,
          total_discount: 0,
          total_tax: template.total_tax,
          grand_total: template.grand_total,
          notes: template.notes,
          status: 'draft',
        })
        .select()
        .single();

      if (invError) throw invError;

      // Copy items
      if (template.items && template.items.length > 0) {
        const invoiceItems = template.items.map((item: any) => ({
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

      // Update next generate date
      let nextDate = new Date(template.next_generate_date);
      switch (template.frequency) {
        case 'weekly':
          nextDate = addWeeks(nextDate, 1);
          break;
        case 'monthly':
          nextDate = addMonths(nextDate, 1);
          break;
        case 'quarterly':
          nextDate = addMonths(nextDate, 3);
          break;
        case 'yearly':
          nextDate = addYears(nextDate, 1);
          break;
      }

      await supabase
        .from('recurring_templates')
        .update({ next_generate_date: nextDate.toISOString().split('T')[0] })
        .eq('id', templateId);

      return invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['recurring_templates'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice Generated',
        description: `Invoice ${invoice.invoice_number} created as draft.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_templates'] });
      toast({ title: 'Template deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getTemplateWithItems = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('recurring_templates')
      .select(`*, client:clients(*), items:recurring_template_items(*)`)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'recurring_template_items', ascending: true })
      .single();

    if (error) throw error;
    return data as RecurringTemplate;
  }, []);

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    generateInvoice,
    deleteTemplate,
    getTemplateWithItems,
    isGenerating: generateInvoice.isPending,
  };
}
