import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, CreditCard, FileText, ArrowRight, ArrowLeft, Check, Loader2,
  Sparkles, Users, Package, Rocket, Store, Briefcase, ShoppingBag, Wrench, Utensils,
  Cpu, Heart, Wheat, MoreHorizontal, Truck, Scissors,
} from 'lucide-react';
import inwWideLogo from '@/assets/inw-wide.png';
import inwWideWhiteLogo from '@/assets/inw-wide-white.png';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { INDIAN_STATES } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LogoUpload } from '@/components/LogoUpload';

const steps = [
  { id: 'business', label: 'Business', icon: Building2, description: 'Tell us about your business' },
  { id: 'location', label: 'Tax & Address', icon: MapPin, description: 'Location, GSTIN, and PAN details' },
  { id: 'payment', label: 'Payment', icon: CreditCard, description: 'UPI and bank account details' },
  { id: 'invoice', label: 'Invoicing', icon: FileText, description: 'Customize your invoice format' },
  { id: 'welcome', label: 'Ready!', icon: Rocket, description: "You're all set to go" },
];

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail / Shop', icon: Store },
  { value: 'wholesale', label: 'Wholesale / Distributor', icon: Truck },
  { value: 'manufacturing', label: 'Manufacturing', icon: Wrench },
  { value: 'service', label: 'Service Provider', icon: Briefcase },
  { value: 'freelancer', label: 'Freelancer / Consultant', icon: Briefcase },
  { value: 'restaurant', label: 'Restaurant / Food', icon: Utensils },
  { value: 'hardware', label: 'Hardware / Building', icon: ShoppingBag },
  { value: 'textile', label: 'Textile / Garments', icon: Scissors },
  { value: 'electronics', label: 'Electronics', icon: Cpu },
  { value: 'medical', label: 'Medical / Pharmacy', icon: Heart },
  { value: 'agriculture', label: 'Agriculture', icon: Wheat },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { updateProfile, isUpdating } = useProfile();
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);

  // Profile form state
  const [orgName, setOrgName] = useState(profile?.org_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [businessType, setBusinessType] = useState(profile?.business_type || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [stateCode, setStateCode] = useState(profile?.state_code || '27');
  const [gstin, setGstin] = useState(profile?.gstin || '');
  const [panNumber, setPanNumber] = useState(profile?.pan_number || '');
  const [upiVpa, setUpiVpa] = useState(profile?.upi_vpa || '');
  const [bankAccountName, setBankAccountName] = useState(profile?.bank_account_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(profile?.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(profile?.bank_ifsc || '');
  const [invoicePrefix, setInvoicePrefix] = useState(profile?.invoice_prefix || 'INV-');
  const [nextNumber, setNextNumber] = useState(profile?.next_invoice_number || 1);


  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return orgName.trim().length > 0;
      case 1: return stateCode.length > 0;
      case 2: return true;
      case 3: return invoicePrefix.trim().length > 0;
      case 4: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };


  const handleFinish = async () => {
    if (!profile) return;

    try {
      await updateProfile({
        id: profile.id,
        org_name: orgName,
        email,
        phone: phone || null,
        address: address || null,
        state_code: stateCode,
        gstin: gstin || null,
        pan_number: panNumber || null,
        upi_vpa: upiVpa || null,
        bank_account_name: bankAccountName || null,
        bank_account_number: bankAccountNumber || null,
        bank_ifsc: bankIfsc || null,
        business_type: businessType || null,
        invoice_prefix: invoicePrefix,
        next_invoice_number: nextNumber,
        onboarding_completed: true,
      });

      await refreshProfile();

      toast({
        title: 'Welcome aboard! 🎉',
        description: 'Your business profile is all set up.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <img src={inwWideLogo} alt="Inw" className="h-8 object-contain" />
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
          Skip for now
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                      i < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : i === currentStep
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn('h-0.5 w-4 sm:w-8 mx-0.5', i < currentStep ? 'bg-primary' : 'bg-border')} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{steps[currentStep].label}</h2>
                <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
              </div>
            </div>

            {/* Step 0: Business Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Business Name *</Label>
                  <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g., Sharma Traders" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">This name will appear on your invoices</p>
                </div>
                <div>
                  <Label>Business Type</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1.5">
                    {BUSINESS_TYPES.map((bt) => {
                      const BtIcon = bt.icon;
                      return (
                        <button
                          key={bt.value}
                          type="button"
                          onClick={() => setBusinessType(bt.value)}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all',
                            businessType === bt.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                          )}
                        >
                          <BtIcon className="w-4 h-4" />
                          <span className="text-center leading-tight">{bt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@example.com" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Business Logo (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Appears on your invoices</p>
                  <LogoUpload currentLogoUrl={profile?.logo_url || null} />
                </div>
              </div>
            )}

            {/* Step 1: Tax & Address */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={stateCode} onValueChange={setStateCode}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INDIAN_STATES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Same state = CGST+SGST, different = IGST</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input id="gstin" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="27XXXXX0000X1Z5" className="mt-1.5" maxLength={15} />
                  </div>
                  <div>
                    <Label htmlFor="pan">PAN Number</Label>
                    <Input id="pan" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="mt-1.5" maxLength={10} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full business address" className="mt-1.5" rows={3} />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    <span className="font-medium text-foreground">Pro tip:</span> Don't have GSTIN/PAN? No worries — add them later in Settings.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="upi">UPI ID (GPay / PhonePe / Paytm)</Label>
                  <Input id="upi" value={upiVpa} onChange={(e) => setUpiVpa(e.target.value)} placeholder="yourname@upi" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">A QR code will appear on invoices</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium mb-3">Bank Account Details (Optional)</p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bankName">Account Holder Name</Label>
                      <Input id="bankName" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="As per bank records" className="mt-1.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="bankAccount">Account Number</Label>
                        <Input id="bankAccount" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="1234567890" className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="bankIfsc">IFSC Code</Label>
                        <Input id="bankIfsc" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} placeholder="SBIN0001234" className="mt-1.5" maxLength={11} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">💡 Tip:</span> Bank details show on invoices alongside the UPI QR code for direct transfers.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Invoice Setup */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prefix">Invoice Number Prefix</Label>
                  <Input id="prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV-" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., INV-, BILL-, {orgName ? orgName.substring(0, 3).toUpperCase() + '-' : 'ABC-'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="nextNum">Starting Number</Label>
                  <Input id="nextNum" type="number" value={nextNumber} onChange={(e) => setNextNumber(parseInt(e.target.value) || 1)} className="mt-1.5" min={1} />
                  <p className="text-xs text-muted-foreground mt-1">Already have existing invoices? Start from that number</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Preview: </span>
                    <span className="font-mono font-semibold text-primary">{invoicePrefix}{String(nextNumber).padStart(4, '0')}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Welcome / Ready */}
            {currentStep === 4 && (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">You're all set, {orgName || 'there'}!</h3>
                  <p className="text-muted-foreground text-sm">Here's what you can do next:</p>
                </div>
                <div className="grid gap-3 text-left">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Create your first invoice</p>
                      <p className="text-xs text-muted-foreground">Click "+ New Invoice" from the dashboard or sidebar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <Package className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Manage your inventory</p>
                      <p className="text-xs text-muted-foreground">Track stock levels and get low-stock alerts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Track client credit (Udhaar)</p>
                      <p className="text-xs text-muted-foreground">Keep tabs on outstanding payments</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={!canProceed() || isUpdating} size="lg">
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Go to Dashboard
                      <Rocket className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
