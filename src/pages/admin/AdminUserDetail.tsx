import { useParams, useNavigate } from 'react-router-dom';
import { useAdminUserDetail } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { INDIAN_STATES } from '@/types';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function AdminUserDetail() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminUserDetail(profileId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!data?.profile) {
    return <div className="p-6 text-center text-muted-foreground">User not found</div>;
  }

  const { profile, invoices, clients, products } = data;
  const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.grand_total), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{profile.org_name}</h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
        <Badge variant={profile.onboarding_completed ? 'default' : 'secondary'} className="ml-auto">
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
        <TabsList>
          <TabsTrigger value="invoices"><FileText className="h-4 w-4 mr-1" /> Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="clients"><Users className="h-4 w-4 mr-1" /> Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" /> Products ({products.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
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
                      <TableCell>{format(new Date(inv.date_issued), 'dd MMM yyyy')}</TableCell>
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
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Credit Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No clients</TableCell></TableRow>
                  ) : clients.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.email || '—'}</TableCell>
                      <TableCell>{c.phone || '—'}</TableCell>
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
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
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
                      <TableCell>{p.sku}</TableCell>
                      <TableCell className="capitalize">{p.type}</TableCell>
                      <TableCell className="text-right">{formatINR(Number(p.selling_price))}</TableCell>
                      <TableCell className="text-right">{p.stock_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
