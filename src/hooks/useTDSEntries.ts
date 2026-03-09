import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TDSEntry {
  id: string;
  profile_id: string;
  client_id: string | null;
  invoice_id: string | null;
  tds_section: string;
  tds_rate: number;
  tds_amount: number;
  gross_amount: number;
  date_deducted: string;
  certificate_number: string | null;
  financial_year: string;
  quarter: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
  invoice?: { invoice_number: string } | null;
}

interface CreateTDSData {
  client_id?: string | null;
  invoice_id?: string | null;
  tds_section: string;
  tds_rate: number;
  tds_amount: number;
  gross_amount: number;
  date_deducted: string;
  certificate_number?: string | null;
  financial_year: string;
  quarter: string;
  notes?: string | null;
}

const EMPTY_ARRAY: TDSEntry[] = [];

export function useTDSEntries() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ['tds_entries', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;
      const { data, error } = await supabase
        .from('tds_entries' as any)
        .select('*, client:clients(name), invoice:invoices(invoice_number)')
        .eq('profile_id', profile.id)
        .order('date_deducted', { ascending: false });
      if (error) throw error;
      return data as unknown as TDSEntry[];
    },
    enabled: !!profile?.id,
  });

  const createEntry = useMutation({
    mutationFn: async (data: CreateTDSData) => {
      if (!profile?.id) throw new Error('No profile');
      const { data: entry, error } = await supabase
        .from('tds_entries' as any)
        .insert({ ...data, profile_id: profile.id, status: 'pending' } as any)
        .select()
        .single();
      if (error) throw error;
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tds_entries'] });
      toast({ title: 'TDS entry created' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TDSEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('tds_entries' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tds_entries'] });
      toast({ title: 'TDS entry updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tds_entries' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tds_entries'] });
      toast({ title: 'TDS entry deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const entries = entriesQuery.data || EMPTY_ARRAY;

  return useMemo(() => ({
    entries,
    isLoading: entriesQuery.isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
  }), [entries, entriesQuery.isLoading, createEntry, updateEntry, deleteEntry]);
}
