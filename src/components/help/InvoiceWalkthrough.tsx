import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  Package,
  Save,
  Send,
  Download,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  MousePointer2,
  Plus,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { modKey } from '@/lib/platform';

interface WalkthroughStep {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ElementType;
  illustration: React.ReactNode;
  tips: string[];
  action?: { label: string; route: string };
}

const MockField = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={cn('rounded-lg border p-2.5 transition-all', highlight ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-muted/30')}>
    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
    <p className="text-xs font-medium truncate">{value}</p>
  </div>
);

const MockLineItem = ({ desc, qty, rate, highlight }: { desc: string; qty: number; rate: number; highlight?: boolean }) => (
  <div className={cn('flex items-center gap-2 rounded-lg border p-2 text-xs transition-all', highlight ? 'border-primary bg-primary/5' : 'border-border bg-muted/20')}>
    <span className="flex-1 font-medium truncate">{desc}</span>
    <span className="text-muted-foreground w-8 text-center">{qty}</span>
    <span className="text-muted-foreground w-16 text-right">₹{rate.toLocaleString('en-IN')}</span>
    <span className="font-semibold w-20 text-right">₹{(qty * rate).toLocaleString('en-IN')}</span>
  </div>
);

const STEPS: WalkthroughStep[] = [
  {
    stepNumber: 1,
    title: 'Start a New Invoice',
    description: 'Click "+ New Invoice" on the Invoices page, press N anywhere, or use the dashboard button.',
    icon: Plus,
    tips: [
      'Press N from any page to instantly start a new invoice',
      `Or use ${modKey}+Shift+I then A`,
      'You can also click "+ New Invoice" on the dashboard',
    ],
    action: { label: 'Try it → Go to Invoices', route: '/invoices' },
    illustration: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium justify-center cursor-pointer hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Invoice
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px]">N</kbd>
          <span>Quick shortcut</span>
        </div>
      </div>
    ),
  },
  {
    stepNumber: 2,
    title: 'Select or Create a Client',
    description: 'Pick an existing client from the dropdown, or create one inline without leaving the editor.',
    icon: Users,
    tips: [
      'Type to search clients by name',
      'Click "+ Create Client" at the bottom to add a new one instantly',
      'Client state determines GST type (CGST+SGST vs IGST)',
    ],
    illustration: (
      <div className="space-y-2">
        <MockField label="Client" value="Sharma Traders" highlight />
        <div className="rounded-lg border border-dashed border-primary/40 p-2 text-center">
          <p className="text-[10px] text-primary font-medium flex items-center justify-center gap-1">
            <Plus className="w-3 h-3" /> Create Client inline
          </p>
        </div>
      </div>
    ),
  },
  {
    stepNumber: 3,
    title: 'Set Dates',
    description: 'Invoice date defaults to today. Set a due date to enable payment tracking and reminders.',
    icon: FileText,
    tips: [
      'Due date enables overdue tracking on Collections page',
      'Leave blank for immediate payment invoices',
      'Past due invoices appear in your overdue buckets',
    ],
    illustration: (
      <div className="grid grid-cols-2 gap-2">
        <MockField label="Invoice Date" value="09 Mar 2026" highlight />
        <MockField label="Due Date" value="23 Mar 2026" />
      </div>
    ),
  },
  {
    stepNumber: 4,
    title: 'Add Line Items',
    description: 'Add products or custom descriptions. Rate, tax, and totals auto-calculate.',
    icon: Package,
    tips: [
      `Press ${modKey}+I to quickly add a new line`,
      'Select a product to auto-fill rate and tax %',
      'Drag ⠿ handle to reorder items',
      'Discount is flat amount (₹) per line',
    ],
    illustration: (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-2">
          <span className="flex-1">Description</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-16 text-right">Rate</span>
          <span className="w-20 text-right">Amount</span>
        </div>
        <MockLineItem desc="Wireless Mouse" qty={5} rate={450} highlight />
        <MockLineItem desc="USB Cable Type-C" qty={10} rate={120} />
        <MockLineItem desc="Laptop Stand" qty={2} rate={1800} />
        <div className="flex justify-end pt-1 pr-2">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Grand Total</p>
            <p className="text-sm font-bold">₹8,154</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    stepNumber: 5,
    title: 'Save as Draft',
    description: 'Save your work anytime. Drafts are editable and don\'t affect stock or numbering.',
    icon: Save,
    tips: [
      `Press ${modKey}+S to save as draft`,
      'Drafts have no invoice number yet',
      'Stock is NOT deducted for drafts',
      'Come back and edit anytime',
    ],
    illustration: (
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
        <div className="flex-1">
          <p className="text-xs font-medium">Invoice saved as draft</p>
          <p className="text-[10px] text-muted-foreground">Editable · No stock impact</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">Draft</Badge>
      </div>
    ),
  },
  {
    stepNumber: 6,
    title: 'Finalize the Invoice',
    description: 'Lock the invoice, assign a number, and deduct stock. This is irreversible.',
    icon: Send,
    tips: [
      `Press ${modKey}+Enter to finalize`,
      'A sequential invoice number is assigned (e.g. INW-0012)',
      'Stock is automatically deducted for product items',
      'Review the stock impact dialog before confirming',
    ],
    illustration: (
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="flex-1">
            <p className="text-xs font-medium">INW-0012</p>
            <p className="text-[10px] text-muted-foreground">Finalized · Stock updated</p>
          </div>
          <Badge className="bg-green-600 text-[10px]">Finalized</Badge>
        </div>
        <p className="text-[10px] text-destructive/80 text-center">⚠ Finalization is permanent</p>
      </div>
    ),
  },
  {
    stepNumber: 7,
    title: 'Share & Collect Payment',
    description: 'Download PDF, share via WhatsApp, email, or generate a public link.',
    icon: Download,
    tips: [
      'Download PDF with logo, GST breakdown, UPI QR code',
      'Generate a public link for WhatsApp/SMS sharing',
      'Email invoice directly to client',
      'Mark as Paid when payment is received',
    ],
    action: { label: 'Try it → Create Your First Invoice', route: '/invoices/new' },
    illustration: (
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Download, label: 'PDF', color: 'bg-blue-500/10 text-blue-600' },
          { icon: Send, label: 'WhatsApp', color: 'bg-green-500/10 text-green-600' },
          { icon: Eye, label: 'Public Link', color: 'bg-purple-500/10 text-purple-600' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className={cn('flex flex-col items-center gap-1 p-3 rounded-xl', color)}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function InvoiceWalkthrough() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const markAndNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  if (!started) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Play className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Invoice Creation Walkthrough</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Learn how to create your first GST-compliant invoice in 7 simple steps. 
              Interactive guide with tips and shortcuts.
            </p>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-[10px]">~3 min</Badge>
              <Badge variant="secondary" className="text-[10px]">7 steps</Badge>
              <Badge variant="secondary" className="text-[10px]">Interactive</Badge>
            </div>
            <Button onClick={() => setStarted(true)} className="mt-5 gap-2">
              <Play className="w-4 h-4" />
              Start Walkthrough
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Progress header */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Step {step.stepNumber} of {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {completedSteps.size}/{STEPS.length} done
              </Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reset} title="Restart">
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
          
          {/* Step dots */}
          <div className="flex items-center gap-1 mt-3">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === currentStep ? 'bg-primary w-5' :
                  completedSteps.has(i) ? 'bg-primary/50 w-2' : 'bg-muted w-2'
                )}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-5 py-4" key={currentStep}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base">{step.title}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
            </div>
            {completedSteps.has(currentStep) && (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Interactive illustration */}
          <div className="rounded-xl border bg-card/50 p-4 mb-4">
            <div className="flex items-center gap-1 mb-2.5">
              <MousePointer2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">PREVIEW</span>
            </div>
            {step.illustration}
          </div>

          {/* Tips */}
          <div className="space-y-2">
            {step.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                <span className="text-foreground/80">{tip}</span>
              </div>
            ))}
          </div>

          {/* Action link */}
          {step.action && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full text-xs gap-1.5"
              onClick={() => navigate(step.action!.route)}
            >
              {step.action.label}
              <ChevronRight className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={markAndNext}
            className="gap-1"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete
              </>
            ) : (
              <>
                Got it, Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
