import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Users,
  Package,
  Keyboard,
  Rocket,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { modKey } from '@/lib/platform';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'inw-walkthrough-completed';
const STORAGE_KEY_SEEN = 'inw-walkthrough-started';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
  tips: string[];
  shortcutHint?: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to INW! 🎉',
    description: 'Your all-in-one invoicing platform. Let\'s take a quick tour of the key features to get you productive fast.',
    icon: Rocket,
    route: '/',
    tips: [
      'This dashboard gives you an at-a-glance view of your business',
      'Track revenue, pending payments, and low stock items',
      'Quick action cards let you jump to common tasks instantly',
    ],
  },
  {
    title: 'Create Invoices',
    description: 'The heart of INW — create professional GST-compliant invoices in seconds.',
    icon: FileText,
    route: '/invoices',
    tips: [
      'Press N anywhere to create a new invoice',
      `Use ${modKey}+S to save drafts, ${modKey}+Enter to finalize`,
      'Add line items, apply discounts, and auto-calculate GST',
      'Download PDF, share via link, or send by email',
    ],
    shortcutHint: 'N → New Invoice',
  },
  {
    title: 'Manage Clients',
    description: 'Keep your client database organized with contact info, GSTIN, and credit tracking.',
    icon: Users,
    route: '/clients',
    tips: [
      'Press A to quickly add a new client',
      'Track outstanding credit (udhaar) per client',
      'Client details auto-fill when creating invoices',
      'Use / to quickly search through your clients',
    ],
    shortcutHint: 'A → Add Client',
  },
  {
    title: 'Products & Inventory',
    description: 'Track your products, services, and stock levels with automatic inventory management.',
    icon: Package,
    route: '/products',
    tips: [
      'Press A to add a new product or service',
      'Set custom GST rates per product',
      'Get low-stock alerts on the dashboard',
      'Stock auto-deducts when invoices are finalized',
    ],
    shortcutHint: 'A → Add Product',
  },
  {
    title: 'Reports & Analytics',
    description: 'Get insights into your business with revenue charts, tax summaries, and more.',
    icon: TrendingUp,
    route: '/reports',
    tips: [
      'View monthly revenue and collection trends',
      'Track GST collected for tax filing',
      'Monitor top clients and products',
      'Export data to CSV for external analysis',
    ],
  },
  {
    title: 'Keyboard Power User ⌨️',
    description: 'INW is built for speed. Master these shortcuts to supercharge your workflow.',
    icon: Keyboard,
    tips: [
      `${modKey}+K → Search anything instantly`,
      `${modKey}+Shift+D/I/C/P → Navigate pages`,
      '/ → Focus search on any list page',
      '? → View all keyboard shortcuts anytime',
      'T → Toggle dark/light mode',
    ],
    shortcutHint: '? → All Shortcuts',
  },
];

interface WalkthroughTutorialProps {
  onComplete: () => void;
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WalkthroughTutorial({ onComplete, externalOpen, onOpenChange }: WalkthroughTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const [stepKey, setStepKey] = useState(0); // forces re-mount for animation
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open for first-time users
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const started = localStorage.getItem(STORAGE_KEY_SEEN);
    if (!completed && !started) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        onOpenChange?.(true);
      }, 3500);
      localStorage.setItem(STORAGE_KEY_SEEN, 'true');
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle external open (restart tour from settings)
  useEffect(() => {
    if (externalOpen !== undefined) {
      setIsOpen(externalOpen);
      if (externalOpen) {
        setCurrentStep(0);
        setDirection('next');
        setStepKey((k) => k + 1);
      }
    }
  }, [externalOpen]);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const animateToStep = (index: number, dir: 'next' | 'prev') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);

    // Short exit delay, then switch step
    setTimeout(() => {
      setCurrentStep(index);
      setStepKey((k) => k + 1);
      const targetStep = STEPS[index];
      if (targetStep.route && location.pathname !== targetStep.route) {
        navigate(targetStep.route);
      }
      // Allow enter animation to play
      setTimeout(() => setAnimating(false), 300);
    }, 150);
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      animateToStep(currentStep + 1, 'next');
    } else {
      complete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1, 'prev');
    }
  };

  const goToStep = (index: number) => {
    if (index === currentStep) return;
    animateToStep(index, index > currentStep ? 'next' : 'prev');
  };

  const close = (markComplete: boolean) => {
    setIsOpen(false);
    onOpenChange?.(false);
    if (markComplete) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onComplete();
  };

  const complete = () => close(true);
  const skip = () => close(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={skip}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg mx-4 mb-4 sm:mb-0 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Progress bar */}
        <div className="px-6 pt-5">
          <Progress value={progress} className="h-1.5 transition-all duration-500" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground font-medium">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground px-2"
              onClick={skip}
            >
              Skip tour
            </Button>
          </div>
        </div>

        {/* Animated content area */}
        <div className="relative overflow-hidden">
          <div
            key={stepKey}
            className={cn(
              'px-6 py-5 transition-all duration-300 ease-out',
              direction === 'next'
                ? 'animate-in slide-in-from-right-4 fade-in duration-300'
                : 'animate-in slide-in-from-left-4 fade-in duration-300'
            )}
          >
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 transition-transform duration-500 ease-out animate-in zoom-in-50 duration-500">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                {step.shortcutHint && (
                  <div className="flex items-center gap-1 mt-0.5 animate-in fade-in slide-in-from-left-2 duration-500 delay-150">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[11px] font-medium text-primary">{step.shortcutHint}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

            {/* Tips with staggered animations */}
            <div className="space-y-2.5">
              {step.tips.map((tip, i) => (
                <div
                  key={`${stepKey}-${i}`}
                  className="flex items-start gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${100 + i * 75}ms`, animationFillMode: 'both' }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-foreground/80">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-500 ease-out',
                i === currentStep
                  ? 'bg-primary w-6'
                  : i < currentStep
                    ? 'bg-primary/40 w-2'
                    : 'bg-muted-foreground/20 w-2'
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={currentStep === 0 || animating}
            className="gap-1 transition-opacity duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={next}
            disabled={animating}
            className="gap-1 transition-all duration-200"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                Get Started
                <Rocket className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Utility to reset walkthrough so it can be replayed */
export function resetWalkthrough() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_SEEN);
}
