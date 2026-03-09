// Core Types for Inw - Invoicing & Inventory System

export type ProductType = 'goods' | 'service';
export type InvoiceStatus = 'draft' | 'finalized' | 'paid' | 'cancelled';
export type PaymentMode = 'cash' | 'upi' | 'credit' | 'split' | 'cheque' | 'neft' | 'rtgs';
export type GSTType = 'intra-state' | 'inter-state';

export interface Profile {
  id: string;
  user_id: string;
  org_name: string;
  email: string;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  state_code: string;
  logo_url: string | null;
  upi_vpa: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  onboarding_completed: boolean;
  business_type: string | null;
  pan_number: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  signature_url: string | null;
  enabled_modules: string[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  profile_id: string;
  name: string;
  sku: string;
  description: string | null;
  type: ProductType;
  hsn_code: string | null;
  selling_price: number;
  tax_rate: number;
  stock_quantity: number;
  low_stock_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  profile_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  gstin: string | null;
  state_code: string;
  credit_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  profile_id: string;
  client_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  date_issued: string;
  date_due: string | null;
  subtotal: number;
  total_tax: number;
  total_discount: number;
  grand_total: number;
  payment_mode: PaymentMode | null;
  payment_date: string | null;
  share_token: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
  discount: number;
  amount: number;
  sort_order: number;
  // Relations
  product?: Product;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  change_amount: number;
  reason: 'invoice_deduction' | 'restock' | 'correction';
  reference_id: string | null;
  created_at: string;
}

// GST Calculation Types
export interface GSTBreakdown {
  type: GSTType;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface InvoiceCalculation {
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  gstBreakdown: GSTBreakdown;
  itemCalculations: ItemCalculation[];
}

export interface ItemCalculation {
  itemId: string;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

// Form Types
export interface InvoiceFormData {
  client_id: string | null;
  date_issued: string;
  date_due: string | null;
  payment_mode: PaymentMode | null;
  notes: string | null;
  items: InvoiceItemFormData[];
}

export interface InvoiceItemFormData {
  id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
  discount: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  pendingAmount: number;
  totalInvoices: number;
  lowStockItems: number;
  recentInvoices: Invoice[];
  topClients: { client: Client; total: number }[];
}

// Indian States for GST
export const INDIAN_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GSTRate = typeof GST_RATES[number];
