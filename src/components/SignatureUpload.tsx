import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Pen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface SignatureUploadProps {
  currentSignatureUrl: string | null;
}

export function SignatureUpload({ currentSignatureUrl }: SignatureUploadProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadSignature = async (file: Blob, filename: string) => {
    if (!user || !profile) return;
    setUploading(true);
    try {
      const path = `${user.id}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(path, file, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(path);

      await updateProfile({ id: profile.id, signature_url: publicUrl });
      await refreshProfile();
      toast({ title: 'Signature saved', description: 'Your digital signature has been uploaded.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({ title: 'File too large', description: 'Signature must be under 1MB.', variant: 'destructive' });
      return;
    }
    await uploadSignature(file, `signature-${Date.now()}.png`);
  };

  const handleRemove = async () => {
    if (!profile) return;
    setUploading(true);
    try {
      await updateProfile({ id: profile.id, signature_url: null });
      await refreshProfile();
      toast({ title: 'Signature removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Canvas drawing
  const startDrawing = () => {
    setDrawing(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1a365d';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }, 50);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const onPointerUp = () => { isDrawingRef.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadSignature(blob, `signature-drawn-${Date.now()}.png`);
      setDrawing(false);
    }, 'image/png');
  };

  return (
    <div className="space-y-3">
      <Label>Digital Signature / Stamp</Label>
      <p className="text-xs text-muted-foreground">
        Upload or draw your signature. It will appear on invoices and quotation PDFs.
      </p>

      {currentSignatureUrl && !drawing && (
        <div className="flex items-center gap-4">
          <div className="border border-border rounded-lg p-3 bg-card">
            <img src={currentSignatureUrl} alt="Signature" className="h-16 object-contain" />
          </div>
          <Button variant="outline" size="sm" onClick={handleRemove} disabled={uploading}>
            <Trash2 className="w-4 h-4 mr-1" /> Remove
          </Button>
        </div>
      )}

      {drawing ? (
        <div className="space-y-3">
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveDrawing} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Signature
            </Button>
            <Button size="sm" variant="outline" onClick={clearCanvas}>Clear</Button>
            <Button size="sm" variant="ghost" onClick={() => setDrawing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
            Upload Image
          </Button>
          <Button variant="outline" size="sm" onClick={startDrawing} disabled={uploading}>
            <Pen className="w-4 h-4 mr-1" /> Draw Signature
          </Button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileUpload} />
        </div>
      )}
    </div>
  );
}
