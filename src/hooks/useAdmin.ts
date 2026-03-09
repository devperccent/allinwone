import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
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
    staleTime: 30 * 60 * 1000, // Admin status rarely changes — cache 30min
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
  ai_tier: string;
  ai_queries_today: number;
  enabled_modules: string[];
  is_suspended: boolean;
  suspended_reason: string | null;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const [
        { data: profiles, error },
        { data: invoices },
        { data: clients },
        { data: products },
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('profile_id, grand_total, status'),
        supabase.from('clients').select('profile_id'),
        supabase.from('products').select('profile_id'),
      ]);
      if (error) throw error;

      // Build lookup maps for O(n) instead of O(n*m) filtering
      const invoicesByProfile = new Map<string, { count: number; revenue: number }>();
      for (const i of invoices || []) {
        const existing = invoicesByProfile.get(i.profile_id) || { count: 0, revenue: 0 };
        existing.count++;
        if (i.status === 'paid') existing.revenue += Number(i.grand_total);
        invoicesByProfile.set(i.profile_id, existing);
      }

      const clientCountByProfile = new Map<string, number>();
      for (const c of clients || []) {
        clientCountByProfile.set(c.profile_id, (clientCountByProfile.get(c.profile_id) || 0) + 1);
      }

      const productCountByProfile = new Map<string, number>();
      for (const p of products || []) {
        productCountByProfile.set(p.profile_id, (productCountByProfile.get(p.profile_id) || 0) + 1);
      }

      return profiles.map((p: any) => {
        const invStats = invoicesByProfile.get(p.id) || { count: 0, revenue: 0 };
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
          invoice_count: invStats.count,
          client_count: clientCountByProfile.get(p.id) || 0,
          product_count: productCountByProfile.get(p.id) || 0,
          total_revenue: invStats.revenue,
          ai_tier: p.ai_tier || 'standard',
          ai_queries_today: p.ai_queries_today || 0,
          enabled_modules: p.enabled_modules || [],
          is_suspended: p.is_suspended || false,
          suspended_reason: p.suspended_reason || null,
        } as AdminUser;
      });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      // All 3 queries in parallel
      const [
        { data: profiles },
        { data: invoices },
        { data: aiUsage },
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at, onboarding_completed, ai_tier, ai_queries_today'),
        supabase.from('invoices').select('id, grand_total, status, created_at'),
        supabase.from('ai_usage_logs').select('model_used, created_at'),
      ]);

      const totalUsers = profiles?.length || 0;
      const onboardedUsers = profiles?.filter((p: any) => p.onboarding_completed).length || 0;
      const premiumUsers = profiles?.filter((p: any) => p.ai_tier === 'premium').length || 0;

      let totalRevenue = 0;
      let pendingRevenue = 0;
      for (const i of invoices || []) {
        const amount = Number(i.grand_total);
        if (i.status === 'paid') totalRevenue += amount;
        else if (i.status === 'finalized') pendingRevenue += amount;
      }

      const today = new Date().toISOString().split('T')[0];
      let aiQueriesToday = 0;
      let aiPremium = 0;
      let aiStandard = 0;
      let aiBudget = 0;
      for (const u of aiUsage || []) {
        if (u.created_at.startsWith(today)) aiQueriesToday++;
        const model = u.model_used || '';
        if (model.includes('pro')) aiPremium++;
        else if (model.includes('lite')) aiBudget++;
        else if (model.includes('flash')) aiStandard++;
      }

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
        totalInvoices: invoices?.length || 0,
        totalRevenue,
        pendingRevenue,
        signupsByMonth,
        aiQueriesToday,
        premiumUsers,
        aiByModel: { premium: aiPremium, standard: aiStandard, budget: aiBudget },
        totalAiQueries: aiUsage?.length || 0,
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
        { data: aiUsage },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('invoices').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('profile_id', profileId),
        supabase.from('products').select('*').eq('profile_id', profileId),
        supabase.from('ai_usage_logs').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
      ]);
      return { 
        profile, 
        invoices: invoices || [], 
        clients: clients || [], 
        products: products || [],
        aiUsage: aiUsage || [],
      };
    },
    enabled: !!profileId,
  });
}

export function useUpdateUserTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ profileId, tier }: { profileId: string; tier: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ai_tier: tier } as any)
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_detail'] });
    },
  });
}

export function useUpdateUserModules() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ profileId, modules }: { profileId: string; modules: string[] }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ enabled_modules: modules } as any)
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_detail'] });
    },
  });
}

export function useResetUserAiQuota() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          ai_queries_today: 0,
          ai_last_query_date: new Date().toISOString().split('T')[0],
        } as any)
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_detail'] });
    },
  });
}
