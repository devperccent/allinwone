import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  Download,
  Mail,
  Eye,
  Pencil,
  Trash2,
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
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/types';

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-draft' },
  finalized: { label: 'Sent', className: 'status-finalized' },
  paid: { label: 'Paid', className: 'status-paid' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
};

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    profile_id: '1',
    client_id: '1',
    invoice_number: 'INW-0001',
    status: 'paid',
    date_issued: '2024-01-15',
    date_due: '2024-01-30',
    subtotal: 25000,
    total_tax: 4500,
    total_discount: 0,
    grand_total: 29500,
    payment_mode: 'upi',
    notes: null,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
    client: {
      id: '1',
      profile_id: '1',
      name: 'ABC Enterprises',
      email: 'abc@example.com',
      phone: '9876543210',
      billing_address: 'Mumbai, Maharashtra',
      gstin: '27AAAAA0000A1Z5',
      state_code: '27',
      credit_balance: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  },
  {
    id: '2',
    profile_id: '1',
    client_id: '2',
    invoice_number: 'INW-0002',
    status: 'finalized',
    date_issued: '2024-01-18',
    date_due: '2024-02-02',
    subtotal: 15000,
    total_tax: 2700,
    total_discount: 500,
    grand_total: 17200,
    payment_mode: null,
    notes: null,
    created_at: '2024-01-18',
    updated_at: '2024-01-18',
    client: {
      id: '2',
      profile_id: '1',
      name: 'XYZ Trading Co.',
      email: 'xyz@example.com',
      phone: '9876543211',
      billing_address: 'Delhi',
      gstin: '07BBBBB0000B1Z5',
      state_code: '07',
      credit_balance: 17200,
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  },
  {
    id: '3',
    profile_id: '1',
    client_id: null,
    invoice_number: 'INW-0003',
    status: 'draft',
    date_issued: '2024-01-20',
    date_due: null,
    subtotal: 5000,
    total_tax: 900,
    total_discount: 0,
    grand_total: 5900,
    payment_mode: null,
    notes: null,
    created_at: '2024-01-20',
    updated_at: '2024-01-20',
  },
];

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/invoices/new">
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by invoice # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="finalized">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No invoices found</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/invoices/new">Create your first invoice</Link>
                  </Button>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td>{invoice.client?.name || 'Walk-in Customer'}</td>
                  <td className="tabular-nums">{invoice.date_issued}</td>
                  <td className="tabular-nums">{invoice.date_due || '-'}</td>
                  <td className="font-semibold tabular-nums">
                    {formatINR(invoice.grand_total)}
                  </td>
                  <td>
                    <Badge className={cn('font-medium', statusConfig[invoice.status].className)}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/${invoice.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/${invoice.id}/edit`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
