import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CreditNote {
  id: string;
  profile_id: string;
  invoice_id: string | null;
  client_id: string | null;
  credit_note_number: string;
  amount: number;
  date_issued: string;
  status: 'issued' | 'applied' | 'cancelled';
  reason: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY: CreditNote[] = [];

export function useCreditNotes() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['credit_notes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY;
      const { data, error } = await supabase
        .from('credit_notes')
        .select('*')
        .eq('profile_id', profile.id)
        .order('date_issued', { ascending: false });
      if (error) throw error;
      return data as CreditNote[];
    },
    enabled: !!profile?.id,
  });

  const createCreditNote = useMutation({
    mutationFn: async (data: {
      invoice_id?: string | null;
      client_id?: string | null;
      amount: number;
      reason?: string | null;
    }) => {
      if (!profile?.id) throw new Error('No profile');
      
      // Generate credit note number
      const existing = await supabase
        .from('credit_notes')
        .select('credit_note_number')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const lastNum = existing.data?.[0]?.credit_note_number?.match(/\d+$/)?.[0] || '0';
      const nextNum = parseInt(lastNum) + 1;
      const credit_note_number = `CN-${String(nextNum).padStart(4, '0')}`;

      const { data: cn, error } = await supabase
        .from('credit_notes')
        .insert({
          profile_id: profile.id,
          credit_note_number,
          invoice_id: data.invoice_id || null,
          client_id: data.client_id || null,
          amount: data.amount,
          reason: data.reason || null,
          status: 'issued',
        })
        .select()
        .single();

      if (error) throw error;
      return cn;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit_notes'] });
      toast({ title: 'Credit note created' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const applyCreditNote = useMutation({
    mutationFn: async ({ creditNoteId, invoiceId }: { creditNoteId: string; invoiceId: string }) => {
      const { error } = await supabase
        .from('credit_notes')
        .update({ status: 'applied', invoice_id: invoiceId })
        .eq('id', creditNoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit_notes'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Credit note applied' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    creditNotes: query.data || EMPTY,
    isLoading: query.isLoading,
    createCreditNote,
    applyCreditNote,
  };
}
