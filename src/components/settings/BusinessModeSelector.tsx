import { Store, Briefcase, Truck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export type BusinessMode = 'retail' | 'freelancer' | 'distributor';

interface BusinessModeSelectorProps {
  value: BusinessMode;
  onChange: (mode: BusinessMode) => void;
}

const MODES: { value: BusinessMode; label: string; description: string; icon: React.ElementType; features: string[] }[] = [
  {
    value: 'retail',
    label: 'Retail / Shop',
    description: 'For shops selling to walk-in customers',
    icon: Store,
    features: ['Quick Bill mode', 'Walk-in customers', 'Cash/UPI payments', 'Basic inventory'],
  },
  {
    value: 'freelancer',
    label: 'Freelancer / Service',
    description: 'For consultants, professionals & service providers',
    icon: Briefcase,
    features: ['Quotations first', 'Client management', 'Milestone payments', 'Time tracking'],
  },
  {
    value: 'distributor',
    label: 'Wholesale / B2B',
    description: 'For distributors selling to other businesses',
    icon: Truck,
    features: ['Credit (Udhaar) focus', 'Bulk orders', 'Client credit limits', 'Purchase orders'],
  },
];

export function BusinessModeSelector({ value, onChange }: BusinessModeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Business Mode</Label>
      <p className="text-xs text-muted-foreground -mt-2">
        Choose how you operate — this optimizes the interface for your workflow
      </p>
      
      <div className="grid gap-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.value;
          
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              className={cn(
                'flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{mode.label}</p>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {mode.features.map((f) => (
                    <span
                      key={f}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full',
                        isSelected
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Smart defaults based on business mode
export function getBusinessModeDefaults(mode: BusinessMode) {
  switch (mode) {
    case 'retail':
      return {
        enabled_modules: ['quick_bill', 'reports'],
        invoice_prefix: 'BILL-',
        focus_page: '/quick-bill',
      };
    case 'freelancer':
      return {
        enabled_modules: ['quotations', 'reports', 'recurring'],
        invoice_prefix: 'INV-',
        focus_page: '/quotations',
      };
    case 'distributor':
      return {
        enabled_modules: ['purchase_orders', 'challans', 'reports', 'quick_bill'],
        invoice_prefix: 'INV-',
        focus_page: '/udhaar',
      };
    default:
      return {
        enabled_modules: ['quick_bill', 'quotations', 'challans', 'purchase_orders', 'recurring', 'reports'],
        invoice_prefix: 'INW-',
        focus_page: '/',
      };
  }
}
