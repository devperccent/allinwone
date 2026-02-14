import { useAdminStats, useAdminUsers } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, IndianRupee, UserCheck, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const navigate = useNavigate();

  const exportCSV = () => {
    if (!users) return;
    const headers = ['Org Name', 'Email', 'Phone', 'Business Type', 'GSTIN', 'State', 'Onboarded', 'Invoices', 'Clients', 'Products', 'Revenue', 'Registered'];
    const rows = users.map(u => [
      u.org_name, u.email || '', u.phone || '', u.business_type || '', u.gstin || '',
      u.state_code, u.onboarding_completed ? 'Yes' : 'No',
      u.invoice_count, u.client_count, u.product_count, u.total_revenue,
      format(new Date(u.created_at), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inw-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground">Platform overview and user management</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!users?.length}>
          <Download className="w-4 h-4 mr-2" />
          Export Users
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? '—'}</div>
            <p className="text-xs text-muted-foreground">{stats?.onboardedUsers ?? 0} onboarded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && stats.totalUsers > 0
                ? `${Math.round((stats.onboardedUsers / stats.totalUsers) * 100)}%`
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">completed setup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInvoices ?? '—'}</div>
            <p className="text-xs text-muted-foreground">across all users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatINR(stats.totalRevenue) : '—'}</div>
            <p className="text-xs text-muted-foreground">{stats ? formatINR(stats.pendingRevenue) : '—'} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Signups Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Signups (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.signupsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
                <TableHead className="text-center">Clients</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : users?.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">No users found</TableCell></TableRow>
              ) : users?.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.org_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{user.business_type || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={user.onboarding_completed ? 'default' : 'secondary'}>
                      {user.onboarding_completed ? 'Active' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{user.invoice_count}</TableCell>
                  <TableCell className="text-center">{user.client_count}</TableCell>
                  <TableCell className="text-right">{formatINR(user.total_revenue)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${user.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
