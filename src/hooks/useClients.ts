import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  gstin?: string;
  state_code: string;
}

const EMPTY_ARRAY: any[] = [];

export function useClients() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', profile.id)
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!profile?.id,
  });

  const clients = clientsQuery.data || EMPTY_ARRAY;

  const totalCreditBalance = useMemo(() =>
    clients.reduce((sum, c) => sum + Number(c.credit_balance), 0),
    [clients]
  );

  const createClient = useMutation({
    mutationFn: async (client: CreateClientData) => {
      if (!profile?.id) throw new Error('No profile');
      
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, profile_id: profile.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client created', description: 'Client added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client deleted', description: 'Client removed successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return useMemo(() => ({
    clients,
    totalCreditBalance,
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient,
    updateClient,
    deleteClient,
  }), [clients, totalCreditBalance, clientsQuery.isLoading, clientsQuery.error, createClient, updateClient, deleteClient]);
}
