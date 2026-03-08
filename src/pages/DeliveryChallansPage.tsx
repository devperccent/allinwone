import { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Truck,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useDeliveryChallans } from '@/hooks/useDeliveryChallans';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  dispatched: { label: 'Dispatched', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

export default function DeliveryChallansPage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const { challans, isLoading, updateChallan, deleteChallan } = useDeliveryChallans();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  usePageShortcuts(useMemo(() => [
    { key: '/', handler: () => searchRef.current?.focus() },
    { key: 'a', handler: () => navigate('/challans/new') },
  ], [navigate]));

  const filteredChallans = challans.filter((c) => {
    const matchesSearch =
      c.challan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Delivery Challans</h1>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
          <Link to="/challans/new">
            <Plus className="w-3.5 h-3.5" />
            New Challan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search by challan #, client, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filteredChallans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No delivery challans found</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/challans/new">Create your first challan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredChallans.map((challan) => (
            <Card key={challan.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 flex-wrap">
                       <Link
                         to={`/challans/${challan.id}`}
                         className="font-semibold text-primary hover:underline"
                       >
                         {challan.challan_number}
                       </Link>
                       <Badge className={cn('text-xs', statusConfig[challan.status]?.className)}>
                         {statusConfig[challan.status]?.label || challan.status}
                       </Badge>
                     </div>
                     <p className="text-sm text-muted-foreground mt-1 truncate">
                       {challan.client?.name || 'No client'} • {challan.date_issued}
                       {challan.vehicle_number && ` • 🚚 ${challan.vehicle_number}`}
                     </p>
                     {challan.dispatch_to && (
                       <p className="text-xs text-muted-foreground mt-0.5 truncate">
                         To: {challan.dispatch_to}
                       </p>
                     )}
                   </div>
                   <div className="flex items-center justify-between sm:justify-end gap-2">
                     <div className="flex items-center gap-1 text-sm">
                       <Package className="w-4 h-4 text-muted-foreground" />
                       <span className="font-medium">{challan.items?.length || 0} items</span>
                     </div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/challans/${challan.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        {challan.status !== 'delivered' && (
                          <DropdownMenuItem asChild>
                            <Link to={`/challans/${challan.id}/edit`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {challan.status === 'draft' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                updateChallan.mutate({ id: challan.id, status: 'dispatched' })
                              }
                            >
                              <Truck className="w-4 h-4 mr-2" />
                              Mark as Dispatched
                            </DropdownMenuItem>
                          </>
                        )}
                        {challan.status === 'dispatched' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                updateChallan.mutate({ id: challan.id, status: 'delivered' })
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Delivered
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteChallan.mutate(challan.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
