import { useState, useRef, useMemo } from 'react';
import {
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Loader2,
  MessageCircle,
  Filter,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useClients } from '@/hooks/useClients';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import { INDIAN_STATES } from '@/types';

export default function ClientsPage() {
  const { clients, totalCreditBalance, isLoading, createClient, deleteClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showCreditOnly, setShowCreditOnly] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gstin: '',
    state_code: '27',
    billing_address: '',
  });

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  // Page shortcuts: / → focus search, A → add client
  usePageShortcuts(useMemo(() => [
    { key: '/', handler: () => searchRef.current?.focus() },
    { key: 'a', handler: () => setIsAddDialogOpen(true) },
  ], []));

  const handleSubmit = () => {
    createClient.mutate({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      gstin: formData.gstin || undefined,
      state_code: formData.state_code,
      billing_address: formData.billing_address || undefined,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          gstin: '',
          state_code: '27',
          billing_address: '',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Clients</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Add a new client to your CRM.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., ABC Enterprises"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="client@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input 
                    id="gstin" 
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Select 
                    value={formData.state_code}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, state_code: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INDIAN_STATES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Billing Address</Label>
                <Textarea 
                  id="address" 
                  placeholder="Full billing address" 
                  rows={2}
                  value={formData.billing_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createClient.isPending || !formData.name}
              >
                {createClient.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                ) : 'Add Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Outstanding credit - compact inline */}
      {totalCreditBalance > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">Outstanding credit</span>
            <span className="text-sm font-bold text-warning">{formatINR(totalCreditBalance)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {clients.filter(c => Number(c.credit_balance) > 0).length} clients
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          ref={searchRef}
          type="search"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Clients List */}
      <div className="grid gap-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-10 rounded-lg border border-border bg-card">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No clients found</p>
            <Button variant="link" size="sm" onClick={() => setIsAddDialogOpen(true)} className="mt-1">
              Add your first client
            </Button>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{client.name}</h3>
                      {client.gstin && (
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">{client.gstin}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {client.email && <span className="truncate">{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {Number(client.credit_balance) > 0 ? (
                    <span className="text-sm font-semibold text-warning tabular-nums hidden sm:block">
                      {formatINR(Number(client.credit_balance))}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground hidden sm:block">No dues</span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteClient.mutate(client.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Mobile credit */}
              {Number(client.credit_balance) > 0 && (
                <div className="sm:hidden mt-2 flex items-center justify-between pt-2 border-t border-border text-sm">
                  <span className="text-muted-foreground">Credit</span>
                  <span className="font-semibold text-warning tabular-nums">{formatINR(Number(client.credit_balance))}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
