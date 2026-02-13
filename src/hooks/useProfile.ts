import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UpdateProfileData {
  id: string;
  org_name?: string;
  email?: string;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  state_code?: string;
  upi_vpa?: string | null;
  invoice_prefix?: string;
  next_invoice_number?: number;
  logo_url?: string | null;
  onboarding_completed?: boolean;
}

export function useProfile() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateProfileData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await refreshProfile();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateProfile = async (data: UpdateProfileData) => {
    return updateProfileMutation.mutateAsync(data);
  };

  return {
    profile,
    updateProfile,
    isUpdating: updateProfileMutation.isPending,
  };
}
