import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, CreditCard, FileText, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import inwWideLogo from '@/assets/inw-wide.png';
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

const steps = [
  { id: 'business', label: 'Business Info', icon: Building2, description: 'Tell us about your business' },
  { id: 'location', label: 'Location & Tax', icon: MapPin, description: 'Set your state and GSTIN' },
  { id: 'payment', label: 'Payment', icon: CreditCard, description: 'Add your UPI for QR codes' },
  { id: 'invoice', label: 'Invoice Setup', icon: FileText, description: 'Customize your invoices' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [orgName, setOrgName] = useState(profile?.org_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [stateCode, setStateCode] = useState(profile?.state_code || '27');
  const [gstin, setGstin] = useState(profile?.gstin || '');
  const [upiVpa, setUpiVpa] = useState(profile?.upi_vpa || '');
  const [invoicePrefix, setInvoicePrefix] = useState(profile?.invoice_prefix || 'INV-');
  const [nextNumber, setNextNumber] = useState(profile?.next_invoice_number || 1);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return orgName.trim().length > 0 && email.trim().length > 0;
      case 1: return stateCode.length > 0;
      case 2: return true; // UPI is optional
      case 3: return invoicePrefix.trim().length > 0;
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
        upi_vpa: upiVpa || null,
        invoice_prefix: invoicePrefix,
        next_invoice_number: nextNumber,
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
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                      i < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : i === currentStep
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn('h-0.5 w-8 sm:w-16 mx-1', i < currentStep ? 'bg-primary' : 'bg-border')} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xl p-8 animate-fade-in">
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
                  <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Corp" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@acme.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5" />
                </div>
              </div>
            )}

            {/* Step 1: Location & Tax */}
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
                  <p className="text-xs text-muted-foreground mt-1">Used for GST calculations (CGST/SGST vs IGST)</p>
                </div>
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="27XXXXX0000X1Z5" className="mt-1.5" maxLength={15} />
                  <p className="text-xs text-muted-foreground mt-1">Optional — will appear on your invoices</p>
                </div>
                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123, Business Park, Mumbai, Maharashtra" className="mt-1.5" rows={3} />
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="upi">UPI VPA</Label>
                  <Input id="upi" value={upiVpa} onChange={(e) => setUpiVpa(e.target.value)} placeholder="yourname@upi" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">A payment QR code will be added to your invoices automatically</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm font-medium mb-1">💡 Why add UPI?</p>
                  <p className="text-xs text-muted-foreground">
                    Your clients can scan a QR code on the invoice to pay instantly. This speeds up payment collection significantly.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Invoice Setup */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prefix">Invoice Prefix *</Label>
                  <Input id="prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV-" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">E.g., INV-, BILL-, {orgName ? orgName.substring(0, 3).toUpperCase() + '-' : 'ABC-'}</p>
                </div>
                <div>
                  <Label htmlFor="nextNum">Starting Invoice Number</Label>
                  <Input id="nextNum" type="number" value={nextNumber} onChange={(e) => setNextNumber(parseInt(e.target.value) || 1)} className="mt-1.5" min={1} />
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Preview: </span>
                    <span className="font-mono font-semibold text-primary">{invoicePrefix}{String(nextNumber).padStart(4, '0')}</span>
                  </p>
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
                <Button onClick={handleFinish} disabled={!canProceed() || isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Finish Setup
                      <Check className="w-4 h-4 ml-2" />
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
