import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  profile_id: string;
  invoice_id: string;
  client_id: string | null;
  amount: number;
  payment_mode: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface PaymentReminder {
  id: string;
  profile_id: string;
  invoice_id: string;
  client_id: string | null;
  reminder_type: string;
  channel: string;
  sent_at: string;
  follow_up_note: string | null;
  created_at: string;
}

const EMPTY: Payment[] = [];
const EMPTY_R: PaymentReminder[] = [];

export function usePayments() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['payments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY;
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', profile.id)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!profile?.id,
  });

  const remindersQuery = useQuery({
    queryKey: ['payment_reminders', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_R;
      const { data, error } = await supabase
        .from('payment_reminders')
        .select('*')
        .eq('profile_id', profile.id)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data as PaymentReminder[];
    },
    enabled: !!profile?.id,
  });

  const recordPayment = useMutation({
    mutationFn: async (data: Omit<Payment, 'id' | 'profile_id' | 'created_at'>) => {
      if (!profile?.id) throw new Error('No profile');
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({ ...data, profile_id: profile.id })
        .select()
        .single();
      if (error) throw error;
      return payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Payment recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const logReminder = useMutation({
    mutationFn: async (data: Omit<PaymentReminder, 'id' | 'profile_id' | 'created_at' | 'sent_at'>) => {
      if (!profile?.id) throw new Error('No profile');
      const { data: reminder, error } = await supabase
        .from('payment_reminders')
        .insert({ ...data, profile_id: profile.id })
        .select()
        .single();
      if (error) throw error;
      return reminder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment_reminders'] });
      toast({ title: 'Reminder logged' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    payments: paymentsQuery.data || EMPTY,
    reminders: remindersQuery.data || EMPTY_R,
    isLoading: paymentsQuery.isLoading,
    recordPayment,
    logReminder,
  };
}
