import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Users,
  Package,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Keyboard,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { modKey } from '@/lib/platform';
import { useIsMobile } from '@/hooks/use-mobile';
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
}

export function WalkthroughTutorial({ onComplete }: WalkthroughTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const started = localStorage.getItem(STORAGE_KEY_SEEN);
    if (!completed && !started) {
      // Show walkthrough prompt after a short delay for first-time users
      const timer = setTimeout(() => setIsOpen(true), 3500);
      localStorage.setItem(STORAGE_KEY_SEEN, 'true');
      return () => clearTimeout(timer);
    }
  }, []);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const goToStep = (index: number) => {
    setCurrentStep(index);
    const targetStep = STEPS[index];
    if (targetStep.route && location.pathname !== targetStep.route) {
      navigate(targetStep.route);
    }
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      complete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const complete = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    onComplete();
  };

  const skip = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={skip} />

      {/* Modal */}
      <div className={cn(
        'relative w-full sm:max-w-lg mx-4 mb-4 sm:mb-0 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300',
      )}>
        {/* Progress bar */}
        <div className="px-6 pt-5">
          <Progress value={progress} className="h-1.5" />
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

        {/* Content */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <step.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{step.title}</h3>
              {step.shortcutHint && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-medium text-primary">{step.shortcutHint}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

          <div className="space-y-2.5">
            {step.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                <span className="text-foreground/80">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                i === currentStep
                  ? 'bg-primary w-6'
                  : i < currentStep
                    ? 'bg-primary/40'
                    : 'bg-muted-foreground/20'
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
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={next}
            className="gap-1"
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
