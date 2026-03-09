import { useAdminStats, useAdminUsers } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, IndianRupee, UserCheck, Eye, Download, Bot, Zap, Crown, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { AnnouncementManager } from '@/components/admin/AnnouncementManager';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

const TIER_COLORS = {
  standard: 'bg-muted text-muted-foreground',
  premium: 'bg-amber-500/20 text-amber-600',
  admin: 'bg-primary/20 text-primary',
};

const AI_MODEL_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const navigate = useNavigate();

  const exportCSV = () => {
    if (!users) return;
    const headers = ['Org Name', 'Email', 'Phone', 'Business Type', 'GSTIN', 'State', 'Onboarded', 'AI Tier', 'Invoices', 'Clients', 'Products', 'Revenue', 'Registered'];
    const rows = users.map(u => [
      u.org_name, u.email || '', u.phone || '', u.business_type || '', u.gstin || '',
      u.state_code, u.onboarding_completed ? 'Yes' : 'No', u.ai_tier,
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

  const aiModelData = stats?.aiByModel ? [
    { name: 'Premium (Pro)', value: stats.aiByModel.premium },
    { name: 'Standard (Flash)', value: stats.aiByModel.standard },
    { name: 'Budget (Lite)', value: stats.aiByModel.budget },
  ] : [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">INW Admin Console</h1>
          <p className="text-sm text-muted-foreground">Super Admin Dashboard • API v1.0.0</p>
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
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">upgraded tier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Queries Today</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.aiQueriesToday ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalAiQueries ?? 0} total</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle>AI Model Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiModelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {aiModelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={AI_MODEL_COLORS[index % AI_MODEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <AnnouncementManager />

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
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">AI Tier</TableHead>
                <TableHead className="text-center">AI Today</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
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
                <TableRow key={user.id} className={(user as any).is_suspended ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {user.org_name}
                      {(user as any).is_suspended && <Ban className="h-4 w-4 text-destructive" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={(user as any).is_suspended ? 'destructive' : user.onboarding_completed ? 'default' : 'secondary'}>
                      {(user as any).is_suspended ? 'Suspended' : user.onboarding_completed ? 'Active' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={TIER_COLORS[user.ai_tier as keyof typeof TIER_COLORS] || TIER_COLORS.standard}>
                      {user.ai_tier || 'standard'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{user.ai_queries_today || 0}</TableCell>
                  <TableCell className="text-center">{user.invoice_count}</TableCell>
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
