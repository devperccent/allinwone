import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  profile_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: string;
  hourly_rate: number;
  total_hours: number;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
}

export interface Milestone {
  id: string;
  project_id: string;
  profile_id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  due_date: string | null;
  invoice_id: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  profile_id: string;
  description: string | null;
  hours: number;
  date: string;
  is_billable: boolean;
  invoice_id: string | null;
  created_at: string;
}

const EMPTY_P: Project[] = [];
const EMPTY_M: Milestone[] = [];
const EMPTY_T: TimeEntry[] = [];

export function useProjects() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_P;
      const { data, error } = await supabase
        .from('projects' as any)
        .select('*, client:clients(id, name)')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Project[];
    },
    enabled: !!profile?.id,
  });

  const createProject = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      if (!profile?.id) throw new Error('No profile');
      const { data: project, error } = await supabase
        .from('projects' as any)
        .insert({ ...data, profile_id: profile.id } as any)
        .select()
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast({ title: 'Project created' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from('projects' as any).update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast({ title: 'Project updated' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast({ title: 'Project deleted' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    projects: projectsQuery.data || EMPTY_P,
    isLoading: projectsQuery.isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useMilestones(projectId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      if (!profile?.id || !projectId) return EMPTY_M;
      const { data, error } = await supabase
        .from('project_milestones' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as unknown as Milestone[];
    },
    enabled: !!profile?.id && !!projectId,
  });

  const createMilestone = useMutation({
    mutationFn: async (data: Partial<Milestone>) => {
      if (!profile?.id) throw new Error('No profile');
      const { error } = await supabase
        .from('project_milestones' as any)
        .insert({ ...data, profile_id: profile.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['milestones'] }); toast({ title: 'Milestone added' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Milestone> & { id: string }) => {
      const { error } = await supabase.from('project_milestones' as any).update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['milestones'] }); toast({ title: 'Milestone updated' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { milestones: query.data || EMPTY_M, isLoading: query.isLoading, createMilestone, updateMilestone };
}

export function useTimeEntries(projectId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['time_entries', projectId],
    queryFn: async () => {
      if (!profile?.id || !projectId) return EMPTY_T;
      const { data, error } = await supabase
        .from('time_entries' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as unknown as TimeEntry[];
    },
    enabled: !!profile?.id && !!projectId,
  });

  const logTime = useMutation({
    mutationFn: async (data: Partial<TimeEntry>) => {
      if (!profile?.id) throw new Error('No profile');
      const { error } = await supabase
        .from('time_entries' as any)
        .insert({ ...data, profile_id: profile.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['time_entries'] }); qc.invalidateQueries({ queryKey: ['projects'] }); toast({ title: 'Time logged' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_entries' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['time_entries'] }); toast({ title: 'Entry deleted' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { entries: query.data || EMPTY_T, isLoading: query.isLoading, logTime, deleteEntry };
}
