import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  currentLogoUrl: string | null;
  onUploaded?: (url: string | null) => void;
  className?: string;
}

export function LogoUpload({ currentLogoUrl, onUploaded, className }: LogoUploadProps) {
  const { profile, refreshProfile } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB allowed.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(path);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      await updateProfile({ id: profile.id, logo_url: urlWithCacheBuster });
      await refreshProfile();
      setPreviewUrl(urlWithCacheBuster);
      onUploaded?.(urlWithCacheBuster);

      toast({ title: 'Logo uploaded', description: 'Your logo will appear on invoices.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!profile) return;
    setUploading(true);
    try {
      await updateProfile({ id: profile.id, logo_url: null });
      await refreshProfile();
      setPreviewUrl(null);
      onUploaded?.(null);
      toast({ title: 'Logo removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              {previewUrl ? 'Change' : 'Upload'}
            </Button>
            {previewUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={uploading}>
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB. Shows on invoices.</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
