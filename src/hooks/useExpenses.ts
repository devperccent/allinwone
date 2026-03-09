import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  profile_id: string;
  amount: number;
  category: string;
  description: string | null;
  payment_mode: string;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent', emoji: '🏠' },
  { value: 'fuel', label: 'Fuel', emoji: '⛽' },
  { value: 'internet', label: 'Internet', emoji: '📶' },
  { value: 'courier', label: 'Courier', emoji: '📦' },
  { value: 'salary', label: 'Salary', emoji: '💰' },
  { value: 'office_supplies', label: 'Office Supplies', emoji: '🖊️' },
  { value: 'travel', label: 'Travel', emoji: '🚗' },
  { value: 'food', label: 'Food & Tea', emoji: '☕' },
  { value: 'maintenance', label: 'Maintenance', emoji: '🔧' },
  { value: 'miscellaneous', label: 'Miscellaneous', emoji: '📋' },
] as const;

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'upi', label: 'UPI', emoji: '📱' },
  { value: 'bank', label: 'Bank Transfer', emoji: '🏦' },
  { value: 'card', label: 'Card', emoji: '💳' },
] as const;

const EMPTY: Expense[] = [];

export function useExpenses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY;
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('profile_id', profile.id)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!profile?.id,
  });

  const expenses = query.data || EMPTY;

  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let total = 0;
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      if (e.expense_date.startsWith(thisMonth)) {
        total += Number(e.amount);
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
      }
    }
    return { total, byCategory };
  }, [expenses]);

  const createExpense = useMutation({
    mutationFn: async (data: Omit<Expense, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
      if (!profile?.id) throw new Error('No profile');
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({ ...data, profile_id: profile.id })
        .select()
        .single();
      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense added' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { expenses, monthlyTotals, isLoading: query.isLoading, createExpense, deleteExpense };
}
