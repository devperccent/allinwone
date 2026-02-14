import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });
}

export interface AdminUser {
  id: string;
  user_id: string;
  org_name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  business_type: string | null;
  onboarding_completed: boolean;
  created_at: string;
  state_code: string;
  invoice_count: number;
  client_count: number;
  product_count: number;
  total_revenue: number;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch invoice stats per profile
      const { data: invoices } = await supabase
        .from('invoices')
        .select('profile_id, grand_total, status');

      // Fetch client counts
      const { data: clients } = await supabase
        .from('clients')
        .select('profile_id');

      // Fetch product counts
      const { data: products } = await supabase
        .from('products')
        .select('profile_id');

      return profiles.map((p: any) => {
        const userInvoices = invoices?.filter((i: any) => i.profile_id === p.id) || [];
        const userClients = clients?.filter((c: any) => c.profile_id === p.id) || [];
        const userProducts = products?.filter((pr: any) => pr.profile_id === p.id) || [];
        const totalRevenue = userInvoices
          .filter((i: any) => i.status === 'paid')
          .reduce((sum: number, i: any) => sum + Number(i.grand_total), 0);

        return {
          id: p.id,
          user_id: p.user_id,
          org_name: p.org_name,
          email: p.email,
          phone: p.phone,
          gstin: p.gstin,
          business_type: p.business_type,
          onboarding_completed: p.onboarding_completed,
          created_at: p.created_at,
          state_code: p.state_code,
          invoice_count: userInvoices.length,
          client_count: userClients.length,
          product_count: userProducts.length,
          total_revenue: totalRevenue,
        } as AdminUser;
      });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, created_at, onboarding_completed');
      const { data: invoices } = await supabase.from('invoices').select('id, grand_total, status, created_at');

      const totalUsers = profiles?.length || 0;
      const onboardedUsers = profiles?.filter((p: any) => p.onboarding_completed).length || 0;
      const totalInvoices = invoices?.length || 0;
      const totalRevenue = invoices
        ?.filter((i: any) => i.status === 'paid')
        .reduce((sum: number, i: any) => sum + Number(i.grand_total), 0) || 0;
      const pendingRevenue = invoices
        ?.filter((i: any) => i.status === 'finalized')
        .reduce((sum: number, i: any) => sum + Number(i.grand_total), 0) || 0;

      // Signups by month (last 6 months)
      const now = new Date();
      const signupsByMonth: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const count = profiles?.filter((p: any) => {
          const c = new Date(p.created_at);
          return c >= d && c < nextMonth;
        }).length || 0;
        signupsByMonth.push({ month: monthStr, count });
      }

      return {
        totalUsers,
        onboardedUsers,
        totalInvoices,
        totalRevenue,
        pendingRevenue,
        signupsByMonth,
      };
    },
  });
}

export function useAdminUserDetail(profileId: string | undefined) {
  return useQuery({
    queryKey: ['admin_user_detail', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const [
        { data: profile },
        { data: invoices },
        { data: clients },
        { data: products },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('invoices').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('profile_id', profileId),
        supabase.from('products').select('*').eq('profile_id', profileId),
      ]);
      return { profile, invoices: invoices || [], clients: clients || [], products: products || [] };
    },
    enabled: !!profileId,
  });
}
