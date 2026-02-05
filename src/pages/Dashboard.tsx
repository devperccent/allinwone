import {
  IndianRupee,
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  Package,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import type { Invoice, Product } from '@/types';

// Mock data for initial display
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

const mockLowStockProducts: Product[] = [
  {
    id: '1',
    profile_id: '1',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    description: 'Ergonomic wireless mouse',
    type: 'goods',
    hsn_code: '8471',
    selling_price: 599,
    stock_quantity: 3,
    low_stock_limit: 10,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    profile_id: '1',
    name: 'USB-C Cable',
    sku: 'UC-001',
    description: 'USB-C to USB-C cable 1m',
    type: 'goods',
    hsn_code: '8544',
    selling_price: 299,
    stock_quantity: 5,
    low_stock_limit: 15,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/invoices/new">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatINR(52600)}
          change="+12.5% from last month"
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-success"
        />
        <StatCard
          title="Pending Amount"
          value={formatINR(17200)}
          change="2 invoices unpaid"
          changeType="neutral"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Total Invoices"
          value="3"
          change="+2 this month"
          changeType="positive"
          icon={FileText}
        />
        <StatCard
          title="Low Stock Items"
          value="2"
          change="Needs attention"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="text-destructive"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/invoices/new"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">New Invoice</p>
            <p className="text-sm text-muted-foreground">Create a new invoice</p>
          </div>
        </Link>
        
        <Link
          to="/products/new"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">Add Product</p>
            <p className="text-sm text-muted-foreground">Add to inventory</p>
          </div>
        </Link>
        
        <Link
          to="/clients/new"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">Add Client</p>
            <p className="text-sm text-muted-foreground">Add a new client</p>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentInvoices invoices={mockInvoices} />
        </div>
        <div>
          <LowStockAlert products={mockLowStockProducts} />
        </div>
      </div>
    </div>
  );
}
