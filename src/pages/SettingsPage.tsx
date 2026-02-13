import { useState, useEffect } from 'react';
import { Building2, CreditCard, Bell, Loader2, ImageIcon } from 'lucide-react';
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
import { LogoUpload } from '@/components/LogoUpload';

export default function SettingsPage() {
  const { toast } = useToast();
  const { profile: authProfile, refreshProfile } = useAuth();
  const { updateProfile, isUpdating } = useProfile();

  // Business form state
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateCode, setStateCode] = useState('27');
  const [address, setAddress] = useState('');
  const [upiVpa, setUpiVpa] = useState('');

  // Invoice form state
  const [invoicePrefix, setInvoicePrefix] = useState('INW-');
  const [nextNumber, setNextNumber] = useState(1);

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
      setInvoicePrefix(authProfile.invoice_prefix || 'INW-');
      setNextNumber(authProfile.next_invoice_number || 1);
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

  if (!authProfile) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your business profile and preferences
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="invoice" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                This information will appear on your invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <div>
                    <Label htmlFor="upi">UPI VPA</Label>
                    <Input
                      id="upi"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      placeholder="yourname@upi"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used to generate payment QR codes
                    </p>
                  </div>
                </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when products are running low
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Send automatic payment reminders to clients
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Invoice Sent Confirmation</p>
                    <p className="text-sm text-muted-foreground">
                      Receive confirmation when invoices are sent
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your business
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
