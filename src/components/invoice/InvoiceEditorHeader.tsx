import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  EyeOff,
  Download,
  Mail,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { modKey } from '@/lib/platform';

interface InvoiceEditorHeaderProps {
  id: string | undefined;
  invoiceNumber: string;
  showPreview: boolean;
  onTogglePreview: () => void;
  onBack: () => void;
  onSave: () => void;
  onFinalize: () => void;
  onDownloadPdf: () => void;
  onEmailClick: () => void;
  onWhatsAppClick: () => void;
  isSaving: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isFinalizing: boolean;
  isDownloading: boolean;
  hasCurrentInvoice: boolean;
  isDraft: boolean;
}

export function InvoiceEditorHeader({
  id,
  invoiceNumber,
  showPreview,
  onTogglePreview,
  onBack,
  onSave,
  onFinalize,
  onDownloadPdf,
  onEmailClick,
  onWhatsAppClick,
  isSaving,
  isCreating,
  isUpdating,
  isFinalizing,
  isDownloading,
  hasCurrentInvoice,
  isDraft,
}: InvoiceEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-border gap-2">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold truncate">
            {id ? 'Edit Invoice' : 'New Invoice'}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {invoiceNumber || 'Will be generated on save'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePreview}
          className="gap-2 hidden lg:flex"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>

        {hasCurrentInvoice && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={onDownloadPdf}
              disabled={isDownloading}
              className="md:hidden"
              title="Download PDF"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadPdf}
              disabled={isDownloading}
              className="gap-2 hidden md:flex"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onEmailClick}
              className="hidden sm:flex md:hidden"
              title="Email"
            >
              <Mail className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEmailClick}
              className="gap-2 hidden md:flex"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onWhatsAppClick}
              className="gap-2 hidden md:flex"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={onSave}
              size="sm"
              className="gap-2"
              disabled={isSaving || isCreating || isUpdating}
            >
              {(isSaving || isCreating || isUpdating) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Save</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Save draft</span>
            <kbd className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">{modKey}+S</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onFinalize}
              size="sm"
              className="gap-2"
              disabled={isFinalizing || !hasCurrentInvoice || !isDraft}
            >
              {isFinalizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Finalize</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Finalize invoice</span>
            <kbd className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">{modKey}+↩</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
