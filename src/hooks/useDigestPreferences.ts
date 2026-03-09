import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DigestPreferences {
  daily_digest: boolean;
  weekly_digest: boolean;
  monthly_digest: boolean;
  digest_email: string;
}

const DEFAULT_PREFS: DigestPreferences = {
  daily_digest: false,
  weekly_digest: true,
  monthly_digest: true,
  digest_email: '',
};

export function useDigestPreferences() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<DigestPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadPrefs();
  }, [profile?.id]);

  const loadPrefs = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('email_digest_preferences' as any)
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (data && !error) {
      setPrefs({
        daily_digest: (data as any).daily_digest ?? false,
        weekly_digest: (data as any).weekly_digest ?? true,
        monthly_digest: (data as any).monthly_digest ?? true,
        digest_email: (data as any).digest_email ?? '',
      });
    }
    setLoading(false);
  };

  const savePrefs = async (updated: DigestPreferences) => {
    if (!profile?.id) return;
    setSaving(true);

    // Upsert
    const { error } = await supabase
      .from('email_digest_preferences' as any)
      .upsert({
        profile_id: profile.id,
        daily_digest: updated.daily_digest,
        weekly_digest: updated.weekly_digest,
        monthly_digest: updated.monthly_digest,
        digest_email: updated.digest_email || null,
      } as any, { onConflict: 'profile_id' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPrefs(updated);
      toast({ title: 'Saved', description: 'Email digest preferences updated.' });
    }
    setSaving(false);
  };

  return { prefs, loading, saving, savePrefs };
}
