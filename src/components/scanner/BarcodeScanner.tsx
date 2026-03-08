import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, X, Loader2, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    setIsStarting(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode('barcode-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          onScan(decodedText);
          onOpenChange(false);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      setError(err?.message || 'Could not access camera. Please allow camera permission.');
    } finally {
      setIsStarting(false);
    }
  }, [onScan, onOpenChange]);

  useEffect(() => {
    if (open) {
      // Small delay to let DOM render
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopScanner(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5" />
            Scan Barcode / QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <div
            id="barcode-scanner-container"
            ref={containerRef}
            className={cn(
              'w-full min-h-[280px] rounded-lg overflow-hidden bg-muted',
              isStarting && 'flex items-center justify-center'
            )}
          >
            {isStarting && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Starting camera...</p>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Point your camera at a barcode or QR code. It will be detected automatically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BarcodeScanButton({ onScan, className }: { onScan: (code: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className={className}
        title="Scan barcode"
      >
        <ScanBarcode className="w-4 h-4" />
      </Button>
      <BarcodeScanner open={open} onOpenChange={setOpen} onScan={onScan} />
    </>
  );
}
