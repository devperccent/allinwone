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
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { INDIAN_STATES } from '@/types';
import type { Client } from '@/types';

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    profile_id: '1',
    name: 'ABC Enterprises',
    email: 'abc@example.com',
    phone: '9876543210',
    billing_address: '123, MG Road, Mumbai, Maharashtra 400001',
    gstin: '27AAAAA0000A1Z5',
    state_code: '27',
    credit_balance: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    profile_id: '1',
    name: 'XYZ Trading Co.',
    email: 'xyz@example.com',
    phone: '9876543211',
    billing_address: '456, Connaught Place, New Delhi 110001',
    gstin: '07BBBBB0000B1Z5',
    state_code: '07',
    credit_balance: 17200,
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
  },
  {
    id: '3',
    profile_id: '1',
    name: 'Tech Solutions Pvt. Ltd.',
    email: 'info@techsolutions.in',
    phone: '9876543212',
    billing_address: '789, Koramangala, Bengaluru, Karnataka 560034',
    gstin: '29CCCCC0000C1Z5',
    state_code: '29',
    credit_balance: 45000,
    created_at: '2024-01-03',
    updated_at: '2024-01-03',
  },
];

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredClients = mockClients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  const totalCredit = mockClients.reduce((sum, c) => sum + c.credit_balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clients and track credit (Udhaar)
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
                <Input id="name" placeholder="e.g., ABC Enterprises" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="client@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="9876543210" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" placeholder="27AAAAA0000A1Z5" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Select>
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
                <Textarea id="address" placeholder="Full billing address" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      {totalCredit > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <IndianRupee className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding Credit (Udhaar)</p>
                <p className="text-2xl font-bold text-warning">{formatINR(totalCredit)}</p>
              </div>
            </div>
            <Badge variant="outline" className="border-warning text-warning">
              {mockClients.filter(c => c.credit_balance > 0).length} clients with pending
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
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary font-semibold text-lg">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                    {client.billing_address && (
                      <div className="flex items-start gap-1 mt-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{client.billing_address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {client.credit_balance > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">Credit Balance</p>
                        <p className="text-lg font-bold text-warning">{formatINR(client.credit_balance)}</p>
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
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
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
