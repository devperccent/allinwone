import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, CreditCard, FileText, ArrowRight, ArrowLeft, Check, Loader2, ImageIcon, Sparkles } from 'lucide-react';
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
import { LogoUpload } from '@/components/LogoUpload';

const steps = [
  { id: 'business', label: 'Business Info', icon: Building2, description: 'Apna business ka naam aur contact daalein' },
  { id: 'location', label: 'Location & Tax', icon: MapPin, description: 'State aur GSTIN set karein — GST auto-calculate hoga' },
  { id: 'payment', label: 'Payment', icon: CreditCard, description: 'UPI add karein — invoice pe QR code aayega' },
  { id: 'invoice', label: 'Invoice Setup', icon: FileText, description: 'Invoice number format customize karein' },
];

const BUSINESS_TYPES = [
  'Retail / Dukaan',
  'Wholesale / Distributor',
  'Manufacturing',
  'Service Provider',
  'Freelancer / Consultant',
  'Restaurant / Food',
  'Hardware / Building Materials',
  'Textile / Garments',
  'Electronics',
  'Medical / Pharmacy',
  'Agriculture / Kisan',
  'Other',
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
      case 0: return orgName.trim().length > 0;
      case 1: return stateCode.length > 0;
      case 2: return true;
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
                  <Label htmlFor="orgName">Business / Dukaan Name *</Label>
                  <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g., Sharma Traders, Gupta Electronics" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Yeh naam aapke invoice pe dikhega</p>
                </div>
                <div>
                  <Label htmlFor="email">Business Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@example.com" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Optional — invoices email se bhejne ke liye</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone / WhatsApp Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5" />
                </div>
                {/* Logo Upload */}
                <div>
                  <Label>Business Logo (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Invoice pe aapka logo dikhega — professional look ke liye</p>
                  <LogoUpload currentLogoUrl={profile?.logo_url || null} />
                </div>
              </div>
            )}

            {/* Step 1: Location & Tax */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="state">State / Rajya *</Label>
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
                  <p className="text-xs text-muted-foreground mt-1">GST auto-calculate hoga — same state = CGST+SGST, different state = IGST</p>
                </div>
                <div>
                  <Label htmlFor="gstin">GSTIN (agar registered ho)</Label>
                  <Input id="gstin" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="27XXXXX0000X1Z5" className="mt-1.5" maxLength={15} />
                  <p className="text-xs text-muted-foreground mt-1">GSTIN nahi hai? Koi baat nahi — baad mein add kar sakte hain</p>
                </div>
                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dukaan ka poora address, jaise: Shop No. 5, Main Market, Indore, MP" className="mt-1.5" rows={3} />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    <span className="font-medium text-foreground">Pro tip:</span> GST ke liye composition scheme mein ho toh bhi yeh kaam karega. Tax rates har item pe set kar sakte ho (0%, 5%, 12%, 18%, 28%).
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="upi">UPI ID (GPay / PhonePe / Paytm)</Label>
                  <Input id="upi" value={upiVpa} onChange={(e) => setUpiVpa(e.target.value)} placeholder="yourname@upi ya 9876543210@paytm" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Invoice pe QR code automatic ban jayega — customer scan karke pay karega</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm font-medium mb-2">💡 UPI se payment jaldi aata hai</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Customer ko invoice mein QR code dikhega</li>
                    <li>• Phone se scan karke seedha payment ho jayega</li>
                    <li>• Udhar / credit ka tension khatam!</li>
                  </ul>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Bank account details:</span> Baad mein Settings se add kar sakte hain
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
                  <p className="text-xs text-muted-foreground mt-1">Pehle se invoices banaye hain? Woh number se start karein</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Preview: </span>
                    <span className="font-mono font-semibold text-primary">{invoicePrefix}{String(nextNumber).padStart(4, '0')}</span>
                  </p>
                </div>
                <div className="p-3 bg-success/5 rounded-lg border border-success/10">
                  <p className="text-xs text-muted-foreground">
                    <Check className="w-3 h-3 inline mr-1 text-success" />
                    Sab set hai! Ab aap invoice bana sakte hain — client aur product add karna bhi invoice se seedha ho jayega.
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
