import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UpdateProfileData {
  org_name?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
  state_code?: string;
  upi_vpa?: string;
  invoice_prefix?: string;
}

export function useProfile() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      if (!profile?.id) throw new Error('No profile');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    profile,
    updateProfile,
  };
}
