import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, CreditCard, Bell, Loader2, RotateCcw, BellRing, LayoutGrid, Globe, Accessibility, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INDIAN_STATES } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import { LogoUpload } from '@/components/LogoUpload';
import { SignatureUpload } from '@/components/SignatureUpload';
import { resetWalkthrough } from '@/components/onboarding/WalkthroughTutorial';
import { ALL_MODULES, type ModuleKey } from '@/hooks/useEnabledModules';
import { isKeyboardHintsEnabled, setKeyboardHintsEnabled } from '@/components/onboarding/KeyboardShortcutsHint';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAccessibility } from '@/hooks/useAccessibility';
import { Slider } from '@/components/ui/slider';
import { BusinessModeSelector, getBusinessModeDefaults, type BusinessMode } from '@/components/settings/BusinessModeSelector';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '@/hooks/useNotifications';

interface LayoutContext {
  setWalkthroughOpen: (open: boolean) => void;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { profile: authProfile, refreshProfile } = useAuth();
  const { updateProfile, isUpdating } = useProfile();
  const { setWalkthroughOpen } = useOutletContext<LayoutContext>();
  const { settings: a11ySettings, updateSettings: updateA11y, resetSettings: resetA11y } = useAccessibility();

  // Business form state
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateCode, setStateCode] = useState('27');
  const [address, setAddress] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Invoice form state
  const [invoicePrefix, setInvoicePrefix] = useState('INW-');
  const [nextNumber, setNextNumber] = useState(1);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getNotificationPreferences);

  // Module preferences
  const [enabledModules, setEnabledModules] = useState<string[]>(
    ALL_MODULES.map(m => m.key)
  );

  // Keyboard hints toggle
  const [keyboardHints, setKeyboardHints] = useState(isKeyboardHintsEnabled);

  const updateNotifPref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    saveNotificationPreferences(updated);
  };

  const toggleModule = (key: string) => {
    setEnabledModules(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSaveModules = async () => {
    if (!authProfile) return;
    try {
      await updateProfile({
        id: authProfile.id,
        enabled_modules: enabledModules,
      });
      await refreshProfile();
      toast({
        title: 'Modules updated',
        description: 'Your active modules have been saved.',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Load profile data
  useEffect(() => {
    if (authProfile) {
      setOrgName(authProfile.org_name || '');
      setEmail(authProfile.email || '');
      setPhone(authProfile.phone || '');
      setGstin(authProfile.gstin || '');
      setStateCode(authProfile.state_code || '27');
      setAddress(authProfile.address || '');
      setUpiVpa(authProfile.upi_vpa || '');
      setPanNumber(authProfile.pan_number || '');
      setBankAccountName(authProfile.bank_account_name || '');
      setBankAccountNumber(authProfile.bank_account_number || '');
      setBankIfsc(authProfile.bank_ifsc || '');
      setInvoicePrefix(authProfile.invoice_prefix || 'INW-');
      setNextNumber(authProfile.next_invoice_number || 1);
      setEnabledModules(authProfile.enabled_modules ?? ALL_MODULES.map(m => m.key));
    }
  }, [authProfile]);

  

  const handleSaveBusiness = async () => {
    if (!authProfile) return;

    try {
      await updateProfile({
        id: authProfile.id,
        org_name: orgName,
        email,
        phone: phone || null,
        gstin: gstin || null,
        state_code: stateCode,
        address: address || null,
        upi_vpa: upiVpa || null,
        pan_number: panNumber || null,
        bank_account_name: bankAccountName || null,
        bank_account_number: bankAccountNumber || null,
        bank_ifsc: bankIfsc || null,
      });

      await refreshProfile();

      toast({
        title: 'Settings saved',
        description: 'Your business profile has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveInvoice = async () => {
    if (!authProfile) return;

    try {
      await updateProfile({
        id: authProfile.id,
        invoice_prefix: invoicePrefix,
        next_invoice_number: nextNumber,
      });

      await refreshProfile();

      toast({
        title: 'Settings saved',
        description: 'Your invoice settings have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // ⌘S → save settings
  usePageShortcuts(useMemo(() => [
    { key: 's', mod: true, handler: () => handleSaveBusiness() },
  ], [orgName, email, phone, gstin, stateCode, address, upiVpa, panNumber, bankAccountName, bankAccountNumber, bankIfsc]));

  if (!authProfile) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <h1 className="text-xl font-bold">Settings</h1>

      <Tabs defaultValue="business" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-muted/50 w-max sm:w-auto">
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Invoice</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="gap-2">
              <Accessibility className="w-4 h-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                This information will appear on your invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selector */}
              <div>
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language / भाषा / ভাষা
                </Label>
                <p className="text-xs text-muted-foreground mb-2">Choose your preferred language for the interface</p>
                <LanguageSelector />
              </div>

              {/* Logo Upload */}
              <div>
                <Label>Business Logo</Label>
                <p className="text-xs text-muted-foreground mb-2">Appears on your invoices and PDF exports</p>
                <LogoUpload currentLogoUrl={authProfile.logo_url} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="org_name">Business Name *</Label>
                  <Input
                    id="org_name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={stateCode} onValueChange={setStateCode}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INDIAN_STATES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-4">Payment Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="upi">UPI VPA (Virtual Payment Address)</Label>
                    <Input
                      id="upi"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      placeholder="yourname@upi"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Works with all UPI apps — GPay, PhonePe, Paytm, BHIM, etc. Your clients can scan the QR with any app.
                    </p>
                    <div className="flex gap-2 mt-2">
                      {['@okicici', '@okaxis', '@oksbi', '@ybl', '@paytm', '@upi'].map(suffix => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => {
                            if (!upiVpa.includes('@')) {
                              setUpiVpa(upiVpa + suffix);
                            }
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bank_name">Bank Account Name</Label>
                    <Input
                      id="bank_name"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_number">Bank Account Number</Label>
                    <Input
                      id="bank_number"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_ifsc">IFSC Code</Label>
                    <Input
                      id="bank_ifsc"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <SignatureUpload currentSignatureUrl={authProfile.signature_url ?? null} />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBusiness} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>
                Customize how your invoices are numbered and formatted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="prefix">Invoice Prefix</Label>
                  <Input
                    id="prefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    E.g., INW-, INV-, BILL-
                  </p>
                </div>
                <div>
                  <Label htmlFor="next_number">Next Invoice Number</Label>
                  <Input
                    id="next_number"
                    type="number"
                    value={nextNumber}
                    onChange={(e) => setNextNumber(parseInt(e.target.value) || 1)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Preview: </span>
                  <span className="font-mono font-semibold">
                    {invoicePrefix}{String(nextNumber).padStart(4, '0')}
                  </span>
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveInvoice} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="w-5 h-5" />
                  Popup Notifications
                </CardTitle>
                <CardDescription>
                  Control how notifications appear while you work.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Toast Popups</p>
                    <p className="text-sm text-muted-foreground">
                      Show a toast when a new notification arrives in real-time
                    </p>
                  </div>
                  <Switch
                    checked={notifPrefs.toastPopups}
                    onCheckedChange={(v) => updateNotifPref('toastPopups', v)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Choose which categories of notifications you receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when products fall below their stock limit
                    </p>
                  </div>
                  <Switch
                    checked={notifPrefs.lowStockAlerts}
                    onCheckedChange={(v) => updateNotifPref('lowStockAlerts', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Invoice Events</p>
                    <p className="text-sm text-muted-foreground">
                      Created, finalized, paid, and cancelled invoice updates
                    </p>
                  </div>
                  <Switch
                    checked={notifPrefs.invoiceEvents}
                    onCheckedChange={(v) => updateNotifPref('invoiceEvents', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Client Events</p>
                    <p className="text-sm text-muted-foreground">
                      New client added notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifPrefs.clientEvents}
                    onCheckedChange={(v) => updateNotifPref('clientEvents', v)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Active Modules</CardTitle>
              <CardDescription>
                Turn off features you don't need to keep your workspace clean and focused. Core features (Invoices, Products, Clients) are always available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ALL_MODULES.map((mod) => (
                <div key={mod.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{mod.label}</p>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  </div>
                  <Switch
                    checked={enabledModules.includes(mod.key)}
                    onCheckedChange={() => toggleModule(mod.key)}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveModules} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Module Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5" />
                  Display & Readability
                </CardTitle>
                <CardDescription>
                  Make the interface easier to read and use. These settings are saved on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Font Size */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Text Size</p>
                      <p className="text-sm text-muted-foreground">
                        Adjust the size of all text in the app
                      </p>
                    </div>
                    <span className="text-sm font-mono font-semibold bg-muted px-2.5 py-1 rounded">
                      {a11ySettings.fontSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground" style={{ fontSize: '12px' }}>A</span>
                    <Slider
                      value={[a11ySettings.fontSize]}
                      onValueChange={([v]) => updateA11y({ fontSize: v })}
                      min={14}
                      max={24}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-muted-foreground" style={{ fontSize: '22px' }}>A</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-muted-foreground">
                      Preview: This is how your text will look at {a11ySettings.fontSize}px. 
                      बिल ₹1,500 का है। বিল ₹1,500।
                    </p>
                  </div>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">High Contrast</p>
                    <p className="text-sm text-muted-foreground">
                      Increase text and border contrast for better visibility
                    </p>
                  </div>
                  <Switch
                    checked={a11ySettings.highContrast}
                    onCheckedChange={(v) => updateA11y({ highContrast: v })}
                  />
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reduce Animations</p>
                    <p className="text-sm text-muted-foreground">
                      Minimise or remove all animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={a11ySettings.reducedMotion}
                    onCheckedChange={(v) => updateA11y({ reducedMotion: v })}
                  />
                </div>

                {/* Large Targets */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Large Touch Targets</p>
                    <p className="text-sm text-muted-foreground">
                      Make buttons and links bigger — easier to tap for elderly users
                    </p>
                  </div>
                  <Switch
                    checked={a11ySettings.largeTargets}
                    onCheckedChange={(v) => updateA11y({ largeTargets: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Keyboard Navigation</CardTitle>
                <CardDescription>
                  This app fully supports keyboard navigation. Here are some tips:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { keys: 'Tab / Shift+Tab', desc: 'Move between elements' },
                    { keys: 'Enter / Space', desc: 'Activate buttons & links' },
                    { keys: 'Esc', desc: 'Close dialogs & menus' },
                    { keys: 'Ctrl+K / ⌘K', desc: 'Open search' },
                    { keys: 'N', desc: 'Create new invoice' },
                    { keys: '?', desc: 'View all shortcuts' },
                  ].map(({ keys, desc }) => (
                    <div key={keys} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <kbd className="inline-flex items-center px-2 py-1 rounded bg-muted text-xs font-mono font-semibold whitespace-nowrap">
                        {keys}
                      </kbd>
                      <span className="text-sm text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={resetA11y}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Restart Tour Card - below tabs */}
      </Tabs>

      <Card className="border-dashed">
        <CardContent className="space-y-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Keyboard Shortcut Hints</p>
              <p className="text-sm text-muted-foreground">
                Show a popup with keyboard shortcut tips when you open the app
              </p>
            </div>
            <Switch
              checked={keyboardHints}
              onCheckedChange={(v) => {
                setKeyboardHints(v);
                setKeyboardHintsEnabled(v);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Platform Walkthrough</p>
              <p className="text-sm text-muted-foreground">
                Replay the guided tour to rediscover features and shortcuts
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              onClick={() => {
                resetWalkthrough();
                setWalkthroughOpen(true);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Restart Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
