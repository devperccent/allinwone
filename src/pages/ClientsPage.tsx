import { useState } from 'react';
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
import { INDIAN_STATES } from '@/types';

export default function ClientsPage() {
  const { clients, totalCreditBalance, isLoading, createClient, deleteClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your clients and track credit
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your CRM.
              </DialogDescription>
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
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
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
                  rows={3}
                  value={formData.billing_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createClient.isPending || !formData.name}
              >
                {createClient.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Client'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      {totalCreditBalance > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <IndianRupee className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding Credit (Udhaar)</p>
                <p className="text-2xl font-bold text-warning">{formatINR(totalCreditBalance)}</p>
              </div>
            </div>
            <Badge variant="outline" className="border-warning text-warning">
              {clients.filter(c => Number(c.credit_balance) > 0).length} clients with pending
            </Badge>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="grid gap-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-card">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No clients found</p>
            <Button variant="link" onClick={() => setIsAddDialogOpen(true)} className="mt-2">
              Add your first client
            </Button>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary font-semibold text-base sm:text-lg shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 sm:mt-2 text-sm text-muted-foreground">
                      {client.email && (
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 shrink-0" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                    {client.billing_address && (
                      <div className="flex items-start gap-1 mt-1 sm:mt-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{client.billing_address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    {Number(client.credit_balance) > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">Credit Balance</p>
                        <p className="text-lg font-bold text-warning">{formatINR(Number(client.credit_balance))}</p>
                      </>
                    ) : (
                      <Badge className="bg-success/10 text-success">No pending</Badge>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteClient.mutate(client.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Mobile credit balance */}
              {Number(client.credit_balance) > 0 && (
                <div className="sm:hidden mt-3 flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Credit Balance</span>
                  <span className="font-bold text-warning">{formatINR(Number(client.credit_balance))}</span>
                </div>
              )}
              
              <div className="mt-4 flex items-center gap-2">
                {client.gstin && (
                  <Badge variant="outline" className="text-xs">
                    GSTIN: {client.gstin}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {INDIAN_STATES[client.state_code] || client.state_code}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
