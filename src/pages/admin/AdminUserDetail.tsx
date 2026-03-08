import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminUserDetail } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, FileText, Users, Package, Loader2, LayoutGrid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { INDIAN_STATES } from '@/types';
import { ALL_MODULES } from '@/hooks/useEnabledModules';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function AdminUserDetail() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminUserDetail(profileId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modulesState, setModulesState] = useState<string[]>([]);
  const [savingModules, setSavingModules] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      setModulesState((data.profile as any).enabled_modules ?? ALL_MODULES.map(m => m.key));
    }
  }, [data?.profile]);

  const handleSaveModules = async () => {
    if (!profileId) return;
    setSavingModules(true);
    const { error } = await supabase
      .from('profiles')
      .update({ enabled_modules: modulesState } as any)
      .eq('id', profileId);
    setSavingModules(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Modules updated', description: 'User modules have been saved.' });
      queryClient.invalidateQueries({ queryKey: ['admin_user_detail', profileId] });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!data?.profile) {
    return <div className="p-6 text-center text-muted-foreground">User not found</div>;
  }

  const { profile, invoices, clients, products } = data;
  const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.grand_total), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="self-start">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.org_name}</h1>
          <p className="text-muted-foreground text-sm truncate">{profile.email}</p>
        </div>
        <Badge variant={profile.onboarding_completed ? 'default' : 'secondary'} className="self-start sm:self-auto">
          {profile.onboarding_completed ? 'Active' : 'Pending Setup'}
        </Badge>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Business Info</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Type:</span> {profile.business_type || '—'}</p>
            <p><span className="text-muted-foreground">Phone:</span> {profile.phone || '—'}</p>
            <p><span className="text-muted-foreground">State:</span> {INDIAN_STATES[profile.state_code] || profile.state_code}</p>
            <p><span className="text-muted-foreground">Address:</span> {profile.address || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tax & Payment</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">GSTIN:</span> {profile.gstin || '—'}</p>
            <p><span className="text-muted-foreground">PAN:</span> {profile.pan_number || '—'}</p>
            <p><span className="text-muted-foreground">UPI:</span> {profile.upi_vpa || '—'}</p>
            <p><span className="text-muted-foreground">Bank:</span> {profile.bank_account_name || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Platform Usage</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Invoices:</span> {invoices.length}</p>
            <p><span className="text-muted-foreground">Clients:</span> {clients.length}</p>
            <p><span className="text-muted-foreground">Products:</span> {products.length}</p>
            <p><span className="text-muted-foreground">Revenue:</span> {formatINR(totalRevenue)}</p>
            <p><span className="text-muted-foreground">Registered:</span> {format(new Date(profile.created_at), 'dd MMM yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for data */}
      <Tabs defaultValue="invoices">
        <div className="overflow-x-auto -mx-6 px-6">
          <TabsList className="w-max">
            <TabsTrigger value="invoices" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
              <span className="text-xs">({invoices.length})</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
              <span className="text-xs">({clients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
              <span className="text-xs">({products.length})</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-1">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Modules</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No invoices</TableCell></TableRow>
                  ) : invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(inv.date_issued), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'finalized' ? 'secondary' : 'outline'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatINR(Number(inv.grand_total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No clients</TableCell></TableRow>
                  ) : clients.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.email || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.phone || '—'}</TableCell>
                      <TableCell className="text-right">{formatINR(Number(c.credit_balance))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No products</TableCell></TableRow>
                  ) : products.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{p.sku}</TableCell>
                      <TableCell className="hidden sm:table-cell capitalize">{p.type}</TableCell>
                      <TableCell className="text-right">{formatINR(Number(p.selling_price))}</TableCell>
                      <TableCell className="text-right">{p.stock_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Active Modules</CardTitle>
              <CardDescription>
                Control which features this user sees. Disabled modules hide the related sidebar links, dashboard widgets, and routes.
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
                    checked={modulesState.includes(mod.key)}
                    onCheckedChange={() =>
                      setModulesState(prev =>
                        prev.includes(mod.key) ? prev.filter(k => k !== mod.key) : [...prev, mod.key]
                      )
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveModules} disabled={savingModules}>
                  {savingModules && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Modules for User
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
