import { useState, useMemo } from 'react';
import { useAdminStats, useAdminUsers } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, IndianRupee, Eye, Download, Bot, Crown, Ban, Search, Filter, ArrowUpDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { AnnouncementManager } from '@/components/admin/AnnouncementManager';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
          <h1 className="text-lg font-bold">INW Admin Console</h1>
          <p className="text-xs text-muted-foreground">Super Admin Dashboard • API v1.0.0</p>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Signups (Last 6 Months)</CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Model Usage</CardTitle>
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

      {/* Users Section */}
      <UsersSection users={users} usersLoading={usersLoading} navigate={navigate} exportCSV={exportCSV} />
    </div>
  );
}

type SortKey = 'org_name' | 'created_at' | 'invoice_count' | 'total_revenue';
type StatusFilter = 'all' | 'active' | 'pending' | 'suspended';

function UsersSection({ users, usersLoading, navigate, exportCSV }: { users: any[] | undefined; usersLoading: boolean; navigate: any; exportCSV: () => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortDesc, setSortDesc] = useState(true);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let result = users;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.org_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(u => {
        if (statusFilter === 'suspended') return (u as any).is_suspended;
        if (statusFilter === 'active') return !(u as any).is_suspended && u.onboarding_completed;
        if (statusFilter === 'pending') return !(u as any).is_suspended && !u.onboarding_completed;
        return true;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (sortBy === 'created_at') { aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime(); }
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase(); }
      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

    return result;
  }, [users, search, statusFilter, sortBy, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else { setSortBy(key); setSortDesc(true); }
  };

  const getInitials = (name: string) =>
    name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  const getStatus = (user: any): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (user.is_suspended) return { label: 'Suspended', variant: 'destructive' };
    if (user.onboarding_completed) return { label: 'Active', variant: 'default' };
    return { label: 'Pending', variant: 'secondary' };
  };

  const statusCounts = useMemo(() => {
    if (!users) return { all: 0, active: 0, pending: 0, suspended: 0 };
    return {
      all: users.length,
      active: users.filter(u => !(u as any).is_suspended && u.onboarding_completed).length,
      pending: users.filter(u => !(u as any).is_suspended && !u.onboarding_completed).length,
      suspended: users.filter(u => (u as any).is_suspended).length,
    };
  }, [users]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">All Users ({filteredUsers.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-full sm:w-48"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
                  <Filter className="w-3 h-3" />
                  <span className="hidden sm:inline">{statusFilter === 'all' ? 'All' : statusFilter}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(['all', 'active', 'pending', 'suspended'] as StatusFilter[]).map(s => (
                  <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="text-xs capitalize justify-between">
                    {s}
                    <span className="text-muted-foreground ml-2">{statusCounts[s]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
                  <ArrowUpDown className="w-3 h-3" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[
                  { key: 'created_at' as SortKey, label: 'Date Joined' },
                  { key: 'org_name' as SortKey, label: 'Name' },
                  { key: 'invoice_count' as SortKey, label: 'Invoices' },
                  { key: 'total_revenue' as SortKey, label: 'Revenue' },
                ].map(s => (
                  <DropdownMenuItem key={s.key} onClick={() => toggleSort(s.key)} className="text-xs justify-between">
                    {s.label}
                    {sortBy === s.key && <span className="text-muted-foreground">{sortDesc ? '↓' : '↑'}</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0" onClick={exportCSV} disabled={!users?.length}>
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{search ? 'No users match your search' : 'No users found'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredUsers.map(user => {
              const status = getStatus(user);
              return (
                <button
                  key={user.id}
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-muted/50 group ${
                    (user as any).is_suspended ? 'opacity-60' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-primary">{getInitials(user.org_name)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{user.org_name}</span>
                      {(user as any).is_suspended && <Ban className="h-3 w-3 text-destructive shrink-0" />}
                      <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                        {status.label}
                      </Badge>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${TIER_COLORS[user.ai_tier as keyof typeof TIER_COLORS] || TIER_COLORS.standard}`}>
                        {user.ai_tier === 'premium' && <Crown className="h-2.5 w-2.5 mr-0.5" />}
                        {user.ai_tier || 'standard'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email || '—'}</p>
                  </div>

                  {/* Stats - hidden on mobile */}
                  <div className="hidden md:flex items-center gap-4 shrink-0">
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center min-w-[3rem]">
                          <p className="text-xs font-medium">{user.invoice_count}</p>
                          <p className="text-[10px] text-muted-foreground">invoices</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">Total invoices created</TooltipContent>
                    </UITooltip>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center min-w-[3rem]">
                          <p className="text-xs font-medium">{user.client_count}</p>
                          <p className="text-[10px] text-muted-foreground">clients</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">Total clients</TooltipContent>
                    </UITooltip>
                    <div className="text-right min-w-[4.5rem]">
                      <p className="text-xs font-medium">{formatINR(user.total_revenue)}</p>
                      <p className="text-[10px] text-muted-foreground">revenue</p>
                    </div>
                    <div className="text-right min-w-[4.5rem]">
                      <p className="text-xs text-muted-foreground">{format(new Date(user.created_at), 'dd MMM yy')}</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
