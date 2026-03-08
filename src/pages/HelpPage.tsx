import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEnabledModules, type ModuleKey } from '@/hooks/useEnabledModules';
import {
  Search,
  LayoutDashboard,
  FileText,
  Package,
  Users,
  TrendingUp,
  Settings,
  Keyboard,
  Bell,
  ChevronDown,
  ChevronRight,
  Zap,
  BookOpen,
  HelpCircle,
  Shield,
  Moon,
  SlidersHorizontal,
  FileCheck,
  Truck,
  ClipboardList,
  RefreshCw,
  Receipt,
  Upload,
  WifiOff,
  Calculator,
  BarChart3,
  Wallet,
  FileSpreadsheet,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { modKey } from '@/lib/platform';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  DATA                                                              */
/* ------------------------------------------------------------------ */

interface DocSection {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  articles: DocArticle[];
  module?: ModuleKey;
}

interface DocArticle {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

const SECTIONS: DocSection[] = [
  /* ===== GETTING STARTED ===== */
  {
    id: 'getting-started',
    icon: Zap,
    title: 'Getting Started',
    description: 'Account setup, onboarding, and your first steps',
    articles: [
      {
        id: 'gs-signup',
        title: 'Creating Your Account',
        tags: ['signup', 'register', 'account'],
        content: `1. Visit the **Sign Up** page and enter your email and a strong password.\n2. Check your inbox for a **verification email** and click the link.\n3. Log in and complete the **Onboarding** wizard.\n\n> **Tip:** Use a business email so clients recognise you when they receive invoices.`,
      },
      {
        id: 'gs-onboarding',
        title: 'Onboarding Wizard',
        tags: ['onboarding', 'setup', 'business', 'profile'],
        content: `The 5-step wizard walks you through:\n\n1. **Business Info** — name, type, and state.\n2. **Tax Details** — GSTIN and PAN number.\n3. **Payment & Bank** — UPI VPA, bank account, IFSC.\n4. **Invoice Setup** — prefix, starting number.\n5. **Welcome Summary** — review and launch.\n\nYou can change any of these later in **Settings**.`,
      },
      {
        id: 'gs-tour',
        title: 'Interactive Walkthrough',
        tags: ['tour', 'tutorial', 'walkthrough', 'guide'],
        content: `A 6-step guided tour introduces you to every section of the app. You can **restart the tour** anytime from **Settings → Platform Walkthrough → Restart Tour**.`,
      },
      {
        id: 'gs-navigation',
        title: 'Navigating the App',
        tags: ['navigation', 'sidebar', 'menu', 'mobile'],
        content: `The **left sidebar** gives you one-click access to every module.\n\n• On **desktop**, click **Collapse** at the bottom to give more workspace.\n• On **mobile**, tap the **☰** icon in the header to open the sidebar.\n• Every sidebar item shows a **keyboard shortcut badge** — use them to navigate without a mouse.`,
      },
    ],
  },

  /* ===== DASHBOARD ===== */
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Metrics, alerts, and a snapshot of your business',
    articles: [
      {
        id: 'dash-overview',
        title: 'Metric Cards',
        tags: ['dashboard', 'overview', 'stats', 'revenue'],
        content: `Four cards at the top:\n\n• **Total Revenue** — sum of all paid invoices.\n• **Pending Amount** — unpaid finalized invoices.\n• **Total Invoices** — count of all invoices.\n• **Overdue Invoices** — invoices past their due date.`,
      },
      {
        id: 'dash-widgets',
        title: 'Dashboard Widgets',
        tags: ['widgets', 'recent', 'activity'],
        content: `Below the metrics you'll find contextual widgets:\n\n• **Recent Invoices** — your latest 5 invoices with status badges.\n• **Recent Quotations** — latest quotes (if module enabled).\n• **Recent Purchase Orders** — latest POs (if module enabled).\n• **Recent Challans** — latest delivery challans (if module enabled).\n• **Low Stock Alerts** — products below their reorder threshold.\n• **Expiring Batches** — batches expiring soon.\n• **Activity Feed** — chronological log of all actions.\n\nWidgets for disabled modules are automatically hidden.`,
      },
      {
        id: 'dash-low-stock-auto',
        title: 'Low Stock & Auto PO',
        tags: ['low stock', 'auto', 'purchase order', 'reorder'],
        content: `Products below their **Low Stock Limit** appear in a warning panel.\n\nIf **Purchase Orders** module is enabled, you can click **Auto-Generate PO** to create a draft purchase order pre-filled with the low-stock products and their reorder quantities.`,
      },
    ],
  },

  /* ===== INVOICES ===== */
  {
    id: 'invoices',
    icon: FileText,
    title: 'Invoices',
    description: 'Create, finalize, share, and track GST-compliant invoices',
    articles: [
      {
        id: 'inv-list',
        title: 'Invoice List & Filtering',
        tags: ['invoice', 'list', 'filter', 'search'],
        content: `All invoices in a searchable, sortable table.\n\n• **Filter by status** — Draft, Finalized, Paid, Cancelled.\n• **Search** — by invoice number or client name.\n• **Quick actions** (⋯ menu) — View, Edit, Duplicate, Delete.\n\n> Press \`/\` to focus search instantly.`,
      },
      {
        id: 'inv-create',
        title: 'Creating a New Invoice',
        tags: ['create', 'new', 'invoice'],
        content: `**Three ways to start:**\n\n1. Click **+ New Invoice** on the Invoices page.\n2. Press \`N\` from anywhere.\n3. Press ${modKey}+Shift+I then \`A\`.\n\nThe editor opens with client selector, date fields, line items, and notes.`,
      },
      {
        id: 'inv-line-items',
        title: 'Line Items',
        tags: ['line items', 'products', 'quantity', 'rate', 'discount', 'tax'],
        content: `Each line item has:\n\n| Field | Description |\n|-------|-------------|\n| **Description** | Product name or custom text |\n| **Qty** | Quantity (default 1) |\n| **Rate** | Price per unit (₹) |\n| **Discount** | Flat discount (₹) |\n| **Tax %** | GST rate (0/5/12/18/28%) |\n| **Amount** | Auto-calculated |\n\n• Press ${modKey}+I to add a new line.\n• **Drag the ⠿ handle** to reorder items.\n• Select a product to auto-fill rate & tax.\n• Click **+ Create Product** inline without leaving the editor.`,
      },
      {
        id: 'inv-inline-create',
        title: 'Inline Client & Product Creation',
        tags: ['inline', 'quick add', 'client', 'product'],
        content: `No need to leave the editor:\n\n• In the **Client** dropdown → **+ Create Client**.\n• In the **Product** dropdown → **+ Create Product**.\n• If a product is out of stock → **Restock** inline.\n\nAfter saving, the new entry is immediately selectable.`,
      },
      {
        id: 'inv-draft-finalize',
        title: 'Draft → Finalize → Paid',
        tags: ['draft', 'finalize', 'paid', 'workflow'],
        content: `**Draft** (${modKey}+S):\n• Editable, no invoice number, no stock deduction.\n\n**Finalize** (${modKey}+Enter):\n• Sequential invoice number assigned (e.g. INW-0012).\n• Stock deducted for each product line.\n• Invoice locked — no further edits.\n• Confirmation dialog shows stock impact.\n\n**Mark as Paid:**\n• Available after finalizing.\n• Records payment date.\n• Counts toward revenue in reports.\n\n> Finalization is **irreversible**. Double-check before confirming.`,
      },
      {
        id: 'inv-pdf-email-share',
        title: 'PDF, Email & Public Link',
        tags: ['pdf', 'email', 'share', 'link', 'whatsapp', 'qr'],
        content: `**PDF Download:**\n• Click the download icon. Includes logo, GST breakdown, UPI QR code, bank details.\n\n**Email:**\n• Click ✉ to send the PDF directly to the client's email.\n\n**Public Link:**\n• Click Share to generate a secure, unique URL.\n• Anyone with the link can view (no login needed).\n• Perfect for **WhatsApp or SMS** delivery.`,
      },
      {
        id: 'inv-preview',
        title: 'Split-View Preview',
        tags: ['preview', 'split', 'side-by-side', 'live'],
        content: `Press ${modKey}+P to toggle a **live PDF preview** beside the editor. Changes update in real-time as you type.`,
      },
      {
        id: 'inv-templates',
        title: 'Invoice Templates',
        tags: ['template', 'design', 'style', 'pdf'],
        content: `Choose from multiple PDF templates when generating invoices. Each template has a different layout and style — select the one that best matches your brand.`,
      },
      {
        id: 'inv-cancel',
        title: 'Cancelling & Deleting',
        tags: ['cancel', 'delete', 'void'],
        content: `• **Draft invoices** can be deleted entirely.\n• **Finalized invoices** can be cancelled — they stay in the system for audit but don't count toward revenue.`,
      },
    ],
  },

  /* ===== QUICK BILL ===== */
  {
    id: 'quick-bill',
    icon: Zap,
    title: 'Quick Bill',
    description: 'Rapid retail billing with barcode scanner support',
    module: 'quick_bill',
    articles: [
      {
        id: 'qb-overview',
        title: 'What is Quick Bill?',
        tags: ['quick bill', 'pos', 'retail', 'fast'],
        content: `Quick Bill is a streamlined POS-style interface for fast retail billing.\n\n• Select products by search or **barcode scan**.\n• Adjust quantities with + / − buttons.\n• See the running total update in real-time.\n• Generate an invoice in one click.\n\nIdeal for shops, counters, and walk-in customers where speed matters.`,
      },
      {
        id: 'qb-barcode',
        title: 'Barcode Scanning',
        tags: ['barcode', 'scanner', 'camera', 'scan'],
        content: `Click the **barcode icon** to open the camera scanner.\n\n• Point your device camera at a product barcode.\n• The product is automatically added to the bill.\n• Works with any standard barcode format.\n\n> Make sure your products have **Barcode** values set in the Products page.`,
      },
    ],
  },

  /* ===== QUOTATIONS ===== */
  {
    id: 'quotations',
    icon: FileCheck,
    title: 'Quotations',
    description: 'Create quotes, track status, and convert to invoices',
    module: 'quotations',
    articles: [
      {
        id: 'qt-overview',
        title: 'Quotation Workflow',
        tags: ['quotation', 'quote', 'estimate', 'proposal'],
        content: `Quotations follow this lifecycle:\n\n**Draft** → **Sent** → **Accepted** or **Rejected** → **Converted**\n\n1. Create a quotation with client, items, and validity date.\n2. Mark as **Sent** when you share it with the client.\n3. Update to **Accepted** or **Rejected** based on response.\n4. Click **Convert to Invoice** to create an invoice pre-filled with the quotation data.`,
      },
      {
        id: 'qt-list',
        title: 'Managing Quotations',
        tags: ['list', 'filter', 'search', 'status'],
        content: `The Quotations page shows all quotes with:\n\n• **Status badges** — Draft, Sent, Accepted, Rejected, Converted.\n• **Search** by number or client name.\n• **Filter** by status.\n• **Quick actions** — View, Edit, Convert to Invoice, Delete.\n\n> Shortcuts: \`/\` to search, \`A\` to create new.`,
      },
      {
        id: 'qt-convert',
        title: 'Converting to Invoice',
        tags: ['convert', 'invoice', 'accept'],
        content: `When a client accepts a quote:\n\n1. Open the quotation or use the ⋯ menu.\n2. Click **Convert to Invoice**.\n3. A new invoice is created with all line items, client, and amounts pre-filled.\n4. The quotation status changes to **Converted** with a link to the invoice.\n\nThis saves you from re-entering data manually.`,
      },
    ],
  },

  /* ===== DELIVERY CHALLANS ===== */
  {
    id: 'challans',
    icon: Truck,
    title: 'Delivery Challans',
    description: 'Track goods dispatch with transport and vehicle details',
    module: 'challans',
    articles: [
      {
        id: 'ch-overview',
        title: 'What are Delivery Challans?',
        tags: ['challan', 'delivery', 'dispatch', 'transport'],
        content: `A Delivery Challan documents goods being **dispatched** to a client, often before invoicing.\n\nUse them when:\n• Sending goods on **approval or returnable** basis.\n• Dispatching goods in **multiple shipments** against one order.\n• Sending goods to a **job worker**.\n\nChallans have their own numbering sequence separate from invoices.`,
      },
      {
        id: 'ch-create',
        title: 'Creating a Challan',
        tags: ['create', 'dispatch', 'vehicle', 'transport'],
        content: `Fill in:\n\n• **Client** — who receives the goods.\n• **Dispatch From / To** — origin and destination addresses.\n• **Transport Mode** — road, rail, air, ship.\n• **Vehicle Number** — for road transport.\n• **Items** — products and quantities being dispatched.\n• **Notes** — any special instructions.\n\nA challan PDF includes all dispatch details for the transporter and receiver.`,
      },
      {
        id: 'ch-status',
        title: 'Challan Status',
        tags: ['status', 'dispatched', 'delivered'],
        content: `Three statuses:\n\n• **Draft** — being prepared.\n• **Dispatched** — goods are in transit.\n• **Delivered** — goods received by client.\n\nLink a challan to an **Invoice** when billing for the dispatched goods.`,
      },
    ],
  },

  /* ===== PURCHASE ORDERS ===== */
  {
    id: 'purchase-orders',
    icon: ClipboardList,
    title: 'Purchase Orders',
    description: 'Create and manage supplier orders with expected delivery tracking',
    module: 'purchase_orders',
    articles: [
      {
        id: 'po-overview',
        title: 'Purchase Order Workflow',
        tags: ['purchase order', 'po', 'supplier', 'order'],
        content: `Purchase Orders track what you're buying from suppliers:\n\n**Draft** → **Sent** → **Received** or **Cancelled**\n\n1. Create a PO with supplier name, GSTIN, and address.\n2. Add products with quantities and rates.\n3. Set an **Expected Delivery** date.\n4. Mark as **Sent** when shared with the supplier.\n5. Mark as **Received** when goods arrive.`,
      },
      {
        id: 'po-supplier',
        title: 'Supplier Information',
        tags: ['supplier', 'gstin', 'address', 'vendor'],
        content: `Each PO captures:\n\n• **Supplier Name** — who you're ordering from.\n• **Supplier GSTIN** — for tax compliance.\n• **Supplier Address** — for the PO document.\n\n> Products can have a **Default Supplier** set, which auto-fills supplier details when creating a PO.`,
      },
      {
        id: 'po-pdf',
        title: 'PO PDF Generation',
        tags: ['pdf', 'download', 'print'],
        content: `Download a professional PDF of any PO to send to your supplier. Includes your business details, supplier info, itemized table with GST breakdown, and expected delivery date.`,
      },
    ],
  },

  /* ===== PURCHASE BILLS ===== */
  {
    id: 'purchase-bills',
    icon: Receipt,
    title: 'Purchase Bills',
    description: 'Record supplier invoices and auto-update inventory',
    module: 'purchase_orders',
    articles: [
      {
        id: 'pb-overview',
        title: 'What are Purchase Bills?',
        tags: ['purchase bill', 'supplier invoice', 'expense'],
        content: `Purchase Bills record invoices **received from suppliers** — the counterpart of your sales invoices.\n\nThey serve two purposes:\n\n1. **Expense tracking** — know what you've spent.\n2. **Stock updates** — finalization increases inventory automatically.`,
      },
      {
        id: 'pb-create',
        title: 'Recording a Purchase Bill',
        tags: ['create', 'record', 'bill', 'supplier'],
        content: `Enter:\n\n• **Bill Number** — the supplier's invoice number.\n• **Bill Date** — date on the supplier's invoice.\n• **Supplier** — name, GSTIN, address.\n• **Items** — products, quantities, rates, and tax.\n• **Batch Info** — optional batch number and expiry date per item.\n\n> When finalized, stock is **increased** for each product line.`,
      },
      {
        id: 'pb-batches',
        title: 'Batch Tracking',
        tags: ['batch', 'expiry', 'lot', 'traceability'],
        content: `Each purchase bill line item can have:\n\n• **Batch Number** — unique lot identifier.\n• **Expiry Date** — for perishable goods.\n\nBatches are tracked in **Products → Batches** and expiring batches appear as alerts on the Dashboard.`,
      },
    ],
  },

  /* ===== RECURRING INVOICES ===== */
  {
    id: 'recurring',
    icon: RefreshCw,
    title: 'Recurring Invoices',
    description: 'Set up invoice templates that auto-generate on schedule',
    module: 'recurring',
    articles: [
      {
        id: 'rec-overview',
        title: 'How Recurring Invoices Work',
        tags: ['recurring', 'template', 'auto', 'schedule'],
        content: `Create a **template** with:\n\n• **Client** — who to bill.\n• **Line Items** — products and amounts.\n• **Frequency** — Weekly, Monthly, Quarterly, or Yearly.\n• **Next Generate Date** — when to create the first invoice.\n\nWhen the date arrives, an invoice is **auto-generated** as a draft from the template.`,
      },
      {
        id: 'rec-manage',
        title: 'Managing Templates',
        tags: ['active', 'pause', 'edit', 'delete'],
        content: `• **Toggle Active/Inactive** — pause a template without deleting it.\n• **Edit** — change items, client, or schedule.\n• **Generate Now** — manually trigger invoice creation.\n• **Delete** — permanently remove the template.\n\nInactive templates skip their next generation date until reactivated.`,
      },
    ],
  },

  /* ===== PRODUCTS & INVENTORY ===== */
  {
    id: 'products',
    icon: Package,
    title: 'Products & Inventory',
    description: 'Catalog, stock levels, batches, HSN codes, and barcode support',
    articles: [
      {
        id: 'prod-list',
        title: 'Product Catalog',
        tags: ['products', 'list', 'catalog', 'search'],
        content: `The Products page shows all items in a sortable table:\n\n• **Name**, **SKU**, **Type** (Product/Service)\n• **Selling Price**, **Tax Rate**, **Stock Qty**\n\n> Press \`/\` to search, \`A\` to add new. Service-type items don't track stock.`,
      },
      {
        id: 'prod-add',
        title: 'Adding a Product',
        tags: ['add', 'create', 'product', 'sku', 'hsn', 'barcode'],
        content: `Fields:\n\n• **Name** — display name on invoices.\n• **SKU** — unique identifier.\n• **Type** — Product (has stock) or Service (no stock).\n• **Selling Price** — default rate (₹).\n• **Tax Rate** — GST % (0, 5, 12, 18, 28).\n• **HSN Code** — GST classification code.\n• **Stock Quantity** — current units.\n• **Low Stock Limit** — alert threshold.\n• **Barcode** — for Quick Bill scanner.\n• **Default Supplier** — name and GSTIN for POs.\n\nWhen selected on an invoice, **rate** and **tax%** auto-fill.`,
      },
      {
        id: 'prod-stock',
        title: 'Stock Management',
        tags: ['stock', 'restock', 'inventory', 'adjustment'],
        content: `Stock changes in two ways:\n\n**Automatic:**\n• Invoice finalization → stock **decreases**.\n• Purchase bill finalization → stock **increases**.\n\n**Manual:**\n• Click **Restock** on any product.\n• Enter quantity and reason.\n\nAll movements logged in the **Inventory Log** with timestamps and reasons.`,
      },
      {
        id: 'prod-batches',
        title: 'Batch & Expiry Tracking',
        tags: ['batch', 'expiry', 'perishable', 'lot'],
        content: `Batches are created when finalizing **Purchase Bills** with batch info.\n\nEach batch has:\n• **Batch Number** — lot identifier.\n• **Quantity** — units in this batch.\n• **Expiry Date** — optional.\n\nExpiring batches (within your alert window) appear on the **Dashboard**.`,
      },
    ],
  },

  /* ===== CLIENTS ===== */
  {
    id: 'clients',
    icon: Users,
    title: 'Clients',
    description: 'Customer directory with GST, billing, and credit tracking',
    articles: [
      {
        id: 'cli-directory',
        title: 'Client Directory',
        tags: ['clients', 'list', 'directory', 'search'],
        content: `All customers with:\n\n• **Name**, **Email**, **Phone**\n• **GSTIN** — for B2B invoices.\n• **State Code** — determines GST type.\n• **Credit Balance** — outstanding amount.\n\n> Press \`/\` to search, \`A\` to add.`,
      },
      {
        id: 'cli-add',
        title: 'Adding a Client',
        tags: ['add', 'create', 'client', 'gstin'],
        content: `**Required:** Name and State Code.\n\n**Recommended:**\n• **Email** — for invoice delivery.\n• **GSTIN** — for B2B compliance.\n• **Billing Address** — appears on PDFs.\n\nYou can also create clients **inline** in the invoice editor.`,
      },
      {
        id: 'cli-gst',
        title: 'GST Handling by State',
        tags: ['gst', 'cgst', 'sgst', 'igst', 'inter-state'],
        content: `The app auto-determines the GST split:\n\n• **Same state** (you + client) → **CGST + SGST** (50/50 split).\n• **Different state** → **IGST** (full rate).\n\nBased on State Code in Settings vs client's state code. Both must be correct for accurate invoices.`,
      },
    ],
  },

  /* ===== REPORTS & ANALYTICS ===== */
  {
    id: 'reports',
    icon: TrendingUp,
    title: 'Reports & Analytics',
    description: 'GST, P&L, cash flow, TDS, party ledger, and GSTR-3B exports',
    module: 'reports',
    articles: [
      {
        id: 'rep-gst',
        title: 'GST Report',
        tags: ['gst', 'report', 'tax', 'filing'],
        content: `Monthly GST summary with:\n\n• **Taxable Amount** — sum of invoice subtotals.\n• **CGST**, **SGST**, **IGST** breakdowns.\n• **Total Tax** collected.\n\nFilter by date range to match your GST filing period.`,
      },
      {
        id: 'rep-revenue',
        title: 'Revenue Analytics',
        tags: ['revenue', 'chart', 'trend', 'analytics'],
        content: `Visual charts showing:\n\n• **Monthly revenue trend** — bar chart.\n• **Invoice status distribution** — Draft / Finalized / Paid / Cancelled.\n• **Top clients** — by revenue.\n• **CSV export** of all data.`,
      },
      {
        id: 'rep-pnl',
        title: 'Profit & Loss Statement',
        tags: ['profit', 'loss', 'p&l', 'income', 'expense'],
        content: `The P&L report calculates:\n\n• **Revenue** — sum of paid invoices.\n• **Expenses** — from finalized purchase bills and committed POs.\n• **Net Profit/Loss** — revenue minus expenses.\n\nIncludes a **monthly bar chart** and **CSV export**. Filter by financial year.`,
      },
      {
        id: 'rep-cashflow',
        title: 'Cash Flow Forecast',
        tags: ['cash flow', 'forecast', 'projection', 'inflow', 'outflow'],
        content: `A **12-week forecast** comparing:\n\n• **Expected Inflows** — from due invoices.\n• **Expected Outflows** — from pending purchase orders.\n\nVisualized as an **area chart** to help you anticipate liquidity needs.`,
      },
      {
        id: 'rep-gstr3b',
        title: 'GSTR-3B Export',
        tags: ['gstr', 'gstr-3b', 'filing', 'json', 'gst portal'],
        content: `Auto-computes your GSTR-3B return data:\n\n• **Tax Liability** — from your sales invoices.\n• **Input Tax Credit (ITC)** — from purchase bills.\n• **Net Payable** — liability minus ITC.\n\nExport as **GST-portal-compatible JSON** for direct upload. Select the month and year to generate.`,
      },
      {
        id: 'rep-tds',
        title: 'TDS Management',
        tags: ['tds', 'tax deducted', 'certificate', 'form 16a'],
        content: `Track tax deductions with full details:\n\n• **TDS Section** — 194C, 194J, 194H, etc.\n• **Gross Amount**, **TDS Rate**, **TDS Amount**.\n• **Financial Year** and **Quarter**.\n• **Status** — Pending, Filed, Paid.\n• **Certificate Number** — reference.\n\nGenerate and download **Form 16A-style PDF certificates** for each entry.`,
      },
      {
        id: 'rep-ledger',
        title: 'Party Ledger',
        tags: ['ledger', 'client', 'account', 'statement', 'balance'],
        content: `A per-client account statement showing:\n\n• All invoices (debits) and payments (credits).\n• **Running balance** over time.\n• **Print-ready layout** — click Print Statement for a clean printout.\n\nSelect any client from the dropdown to view their complete transaction history.`,
      },
    ],
  },

  /* ===== DATA MANAGER ===== */
  {
    id: 'data-manager',
    icon: Upload,
    title: 'Data Manager',
    description: 'Import from Excel/Tally, export data for your CA',
    articles: [
      {
        id: 'dm-excel-import',
        title: 'Excel / CSV Import',
        tags: ['import', 'excel', 'csv', 'upload', 'bulk'],
        content: `Import clients or products from spreadsheets:\n\n1. Go to **Data Manager → Excel Import**.\n2. Choose **Clients** or **Products** tab.\n3. Upload your .xlsx or .csv file.\n4. **Map columns** — the app auto-detects common column names.\n5. **Preview data** — review before importing.\n6. Click **Import** — progress bar shows completion.\n\nThe importer handles:\n• Fuzzy column matching (e.g. "Customer Name" → Name).\n• Chunked processing for large files.\n• Error reporting with success/failure counts.`,
      },
      {
        id: 'dm-tally-import',
        title: 'Tally XML Import',
        tags: ['tally', 'xml', 'import', 'migration'],
        content: `Import data from **Tally** XML exports:\n\n1. Export masters from Tally as XML.\n2. Go to **Data Manager → Tally Import**.\n3. Upload the XML file.\n4. The parser extracts:\n   • **LEDGER** entries → Clients.\n   • **STOCKITEM** entries → Products.\n5. Review and confirm the import.`,
      },
      {
        id: 'dm-export',
        title: 'Exporting Data',
        tags: ['export', 'excel', 'tally', 'ca', 'accountant'],
        content: `One-click exports available:\n\n• **Clients (Excel)** — full client directory.\n• **Products (Excel)** — complete catalog with stock.\n• **Invoices (Excel)** — all invoices with amounts and status.\n• **Tally XML** — clients + products in Tally-compatible format.\n\n> Perfect for sharing data with your **CA (Chartered Accountant)**.`,
      },
    ],
  },

  /* ===== OFFLINE MODE ===== */
  {
    id: 'offline',
    icon: WifiOff,
    title: 'Offline Mode',
    description: 'Work without internet — changes sync when you are back online',
    articles: [
      {
        id: 'off-how',
        title: 'How Offline Mode Works',
        tags: ['offline', 'pwa', 'sync', 'internet', 'connectivity'],
        content: `The app is a **Progressive Web App (PWA)** that works without internet:\n\n• **Pages load from cache** — the full app is saved locally.\n• **Data is cached** — recent data available offline.\n• **Changes queue up** — edits are stored locally and sync when you're back online.\n\nThe status indicator in the header shows your connection state.`,
      },
      {
        id: 'off-sync',
        title: 'Sync Queue & Indicator',
        tags: ['sync', 'queue', 'pending', 'indicator'],
        content: `When offline, changes are queued in a local database.\n\n• A **yellow indicator** in the header shows "Offline — X pending".\n• When internet returns, changes **auto-sync** in order.\n• Successful syncs show a toast notification.\n• Failed syncs retry up to 3 times.\n\nYou can also manually trigger sync by clicking the indicator.`,
      },
      {
        id: 'off-install',
        title: 'Installing as an App',
        tags: ['install', 'pwa', 'home screen', 'app'],
        content: `Install the app on your device for the best offline experience:\n\n• **Android:** Chrome → ⋮ menu → "Add to Home screen".\n• **iOS:** Safari → Share → "Add to Home Screen".\n• **Desktop:** Chrome shows an install icon in the address bar.\n\nThe installed app works like a native app with its own icon and window.`,
      },
    ],
  },

  /* ===== SETTINGS ===== */
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings & Configuration',
    description: 'Business profile, payment details, numbering, modules, and preferences',
    articles: [
      {
        id: 'set-business',
        title: 'Business Profile',
        tags: ['business', 'profile', 'logo', 'gstin', 'pan'],
        content: `Configure your business identity:\n\n• **Logo** — upload for PDF invoices.\n• **Business Name** — company or firm name.\n• **Email & Phone** — contact details.\n• **GSTIN** — 15-digit GST number.\n• **PAN** — Permanent Account Number.\n• **State** — registered business state.\n• **Address** — printed on invoices.`,
      },
      {
        id: 'set-payment',
        title: 'Payment Details (UPI & Bank)',
        tags: ['upi', 'bank', 'payment', 'qr code', 'ifsc'],
        content: `• **UPI VPA** (e.g. business@upi) — enables **QR code** on PDFs.\n• **Bank Account Name, Number, IFSC** — printed on invoices.\n\nWhen UPI is set, every PDF gets a scannable QR code for instant payment via GPay, PhonePe, Paytm, etc.`,
      },
      {
        id: 'set-numbering',
        title: 'Invoice & Document Numbering',
        tags: ['number', 'prefix', 'sequence', 'invoice number'],
        content: `Configure for each document type:\n\n• **Invoice Prefix** — e.g. INW-, INV-.\n• **Next Invoice Number** — auto-incremented on finalization.\n• **Quotation Prefix** — e.g. QT-.\n• **Next PO / Challan Number** — separate sequences.\n\nA live preview shows the next number.`,
      },
      {
        id: 'set-modules',
        title: 'Feature Modules',
        tags: ['modules', 'enable', 'disable', 'toggle'],
        content: `Toggle features you need:\n\n• **Quick Bill** — retail POS checkout.\n• **Quotations** — quotes and estimates.\n• **Delivery Challans** — dispatch tracking.\n• **Purchase Orders** — supplier management.\n• **Recurring Invoices** — auto-generation.\n• **Reports** — analytics and compliance.\n\nDisabled modules hide from sidebar, dashboard, and routes. Start small and enable as your business grows.`,
      },
      {
        id: 'set-notifications',
        title: 'Notification Preferences',
        tags: ['notifications', 'alerts', 'preferences'],
        content: `Toggle:\n\n• **Toast Popups** — real-time notifications.\n• **Low Stock Alerts** — stock threshold warnings.\n• **Invoice Events** — created, finalized, paid.\n• **Client Events** — new client notifications.\n\nEven if popups are off, notifications appear in the **🔔 bell** in the header.`,
      },
      {
        id: 'set-expiry',
        title: 'Expiry Alert Window',
        tags: ['expiry', 'alert', 'days', 'batch'],
        content: `Set how many days before batch expiry to show alerts (default: 30 days). Applies to the **Expiring Batches** widget on the Dashboard.`,
      },
    ],
  },

  /* ===== KEYBOARD SHORTCUTS ===== */
  {
    id: 'shortcuts',
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    description: 'Navigate and work faster with keyboard shortcuts',
    articles: [
      {
        id: 'kb-global',
        title: 'Global Shortcuts',
        tags: ['shortcut', 'keyboard', 'search', 'theme'],
        content: `| Shortcut | Action |\n|----------|--------|\n| ${modKey}+K | Open Global Search |\n| ? | Show Shortcuts Dialog |\n| N | New Invoice |\n| T | Toggle Theme |\n| Esc | Blur / Dismiss |`,
      },
      {
        id: 'kb-navigation',
        title: 'Navigation Shortcuts',
        tags: ['navigation', 'hotkey', 'navigate'],
        content: `All use **${modKey}+Shift+Key**:\n\n| Key | Destination |\n|-----|-------------|\n| D | Dashboard |\n| I | Invoices |\n| C | Clients |\n| P | Products |\n| Q | Quotations |\n| O | Purchase Orders |\n| L | Delivery Challans |\n| B | Purchase Bills |\n| U | Recurring Invoices |\n| R | Reports |\n| E | Data Manager |\n| S | Settings |\n\nThese are also shown as **badges** in the sidebar.`,
      },
      {
        id: 'kb-list-pages',
        title: 'List Page Shortcuts',
        tags: ['list', 'search', 'add', 'page'],
        content: `On any list page (Invoices, Clients, Products, etc.):\n\n| Shortcut | Action |\n|----------|--------|\n| / | Focus search input |\n| A | Add new item |`,
      },
      {
        id: 'kb-editor',
        title: 'Invoice Editor Shortcuts',
        tags: ['editor', 'save', 'finalize', 'preview'],
        content: `| Shortcut | Action |\n|----------|--------|\n| ${modKey}+S | Save Draft |\n| ${modKey}+Enter | Finalize Invoice |\n| ${modKey}+P | Toggle Preview |\n| ${modKey}+I | Add Line Item |`,
      },
    ],
  },

  /* ===== NOTIFICATIONS ===== */
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Real-time alerts for invoices, stock, and business events',
    articles: [
      {
        id: 'notif-bell',
        title: 'Notification Bell',
        tags: ['bell', 'badge', 'unread'],
        content: `The **🔔** icon in the header shows unread count.\n\nClick to see recent notifications with title, message, and time. Click any notification to navigate to the relevant page. Notifications auto-mark as read when viewed.`,
      },
      {
        id: 'notif-types',
        title: 'Notification Types',
        tags: ['types', 'low stock', 'invoice', 'client'],
        content: `The system generates:\n\n• **📦 Low Stock** — product below threshold after invoice.\n• **📄 Invoice Events** — created, finalized, paid, cancelled.\n• **👤 Client Events** — new client added.\n\nToggle each type in **Settings → Notifications**.`,
      },
    ],
  },

  /* ===== THEME ===== */
  {
    id: 'theme',
    icon: Moon,
    title: 'Theme & Appearance',
    description: 'Light mode, dark mode, and system preference',
    articles: [
      {
        id: 'theme-toggle',
        title: 'Switching Themes',
        tags: ['theme', 'dark', 'light', 'toggle'],
        content: `**Three ways:**\n\n1. Press **T** on your keyboard.\n2. Click the **🌙/☀** icon in the header.\n3. Follows your **system preference** on first load.\n\nThe theme persists across sessions. All UI, charts, and PDF previews adapt.`,
      },
    ],
  },

  /* ===== GST COMPLIANCE ===== */
  {
    id: 'gst',
    icon: Shield,
    title: 'GST Compliance',
    description: 'Tax rules, HSN codes, and calculation formulas',
    articles: [
      {
        id: 'gst-how',
        title: 'How GST Works',
        tags: ['gst', 'tax', 'cgst', 'sgst', 'igst'],
        content: `The app handles Indian GST automatically:\n\n• **Same state** → CGST + SGST (50/50 split).\n• **Different state** → IGST (full rate).\n\nRates: 0%, 5%, 12%, 18%, 28% — set per product.\n\nPDFs show a clear breakdown with HSN codes for compliance.`,
      },
      {
        id: 'gst-formula',
        title: 'Tax Calculation Formula',
        tags: ['formula', 'calculation', 'amount'],
        content: `**Amount = (Qty × Rate − Discount) × (1 + Tax%/100)**\n\nExample:\n• Qty: 10, Rate: ₹500, Discount: ₹200, Tax: 18%\n• Taxable: (10 × 500 − 200) = ₹4,800\n• Tax: ₹4,800 × 18% = ₹864\n• **Amount: ₹5,664**`,
      },
      {
        id: 'gst-hsn',
        title: 'HSN Codes',
        tags: ['hsn', 'code', 'classification'],
        content: `**HSN** codes classify goods for GST. Add them when creating products — they appear on invoice PDFs.\n\n> Required for businesses with turnover above ₹5 crore. Check CBIC website or ask your CA.`,
      },
    ],
  },

  /* ===== TIPS ===== */
  {
    id: 'tips',
    icon: HelpCircle,
    title: 'Tips & Best Practices',
    description: 'Pro tips for efficient invoicing and business management',
    articles: [
      {
        id: 'tip-workflow',
        title: 'Recommended Workflow',
        tags: ['workflow', 'best practice', 'process'],
        content: `1. **Set up products** — with rates, tax, HSN codes.\n2. **Add clients** — with GSTIN and state.\n3. **Create invoice** → select client → add items.\n4. **Save as Draft** → review in split-view.\n5. **Finalize** → stock deducted, number assigned.\n6. **Share** → PDF, email, or WhatsApp link.\n7. **Mark as Paid** → when payment received.`,
      },
      {
        id: 'tip-services',
        title: 'Services vs Products',
        tags: ['service', 'product', 'type'],
        content: `• **Product** — physical goods with stock tracking.\n• **Service** — labour, consulting, etc. No stock, no low-stock alerts.`,
      },
      {
        id: 'tip-mobile',
        title: 'Using on Mobile',
        tags: ['mobile', 'responsive', 'phone'],
        content: `The app is fully responsive.\n\n• Use the **☰ menu** for sidebar.\n• Invoice editor uses single-column layout.\n• Install as PWA for the best experience.\n\n> For detailed invoice editing, we recommend a tablet or desktop.`,
      },
      {
        id: 'tip-upi-qr',
        title: 'UPI QR Code on Invoices',
        tags: ['qr', 'upi', 'payment', 'gpay'],
        content: `1. Go to **Settings → Payment Details**.\n2. Enter your **UPI VPA** (e.g. business@upi).\n3. Every PDF now includes a **scannable QR code**.\n\nClients can pay instantly with GPay, PhonePe, Paytm, or any UPI app.`,
      },
      {
        id: 'tip-backup',
        title: 'Regular Backups',
        tags: ['backup', 'export', 'data safety'],
        content: `Regularly export data from the **Data Manager** page:\n\n• Clients, Products, Invoices as Excel.\n• Tally XML for your CA.\n\nCSV/Excel files serve as an offline backup.`,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                         */
/* ------------------------------------------------------------------ */

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [expandedArticle, setExpandedArticle] = useState<string | null>('gs-signup');
  const { isModuleEnabled } = useEnabledModules();

  const filteredSections = useMemo(() => {
    const moduleSections = SECTIONS.filter(s => !s.module || isModuleEnabled(s.module));
    if (!searchQuery.trim()) return moduleSections;
    const q = searchQuery.toLowerCase();
    return moduleSections.map((section) => ({
      ...section,
      articles: section.articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
      ),
    })).filter((s) => s.articles.length > 0);
  }, [searchQuery, isModuleEnabled]);

  const totalArticles = SECTIONS.reduce((sum, s) => sum + s.articles.length, 0);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const toggleArticle = (id: string) => {
    setExpandedArticle((prev) => (prev === id ? null : id));
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('|')) {
        const cells = line.split('|').filter(Boolean).map((c) => c.trim());
        if (cells.every((c) => c.match(/^[-]+$/))) return null;
        const nextLine = text.split('\n')[text.split('\n').indexOf(line) + 1];
        const isHeader = nextLine?.includes('---');
        return (
          <div key={i} className={cn('grid gap-4', cells.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {cells.map((cell, j) => (
              <span key={j} className={cn('text-sm py-1', isHeader ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {renderInline(cell)}
              </span>
            ))}
          </div>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <div key={i} className="border-l-2 border-primary/40 pl-3 py-1 my-2 text-sm text-muted-foreground italic bg-primary/5 rounded-r">
            {renderInline(line.slice(2))}
          </div>
        );
      }
      if (line.startsWith('**') && line.endsWith('**') && line.indexOf('**', 2) === line.length - 2) {
        return <p key={i} className="font-semibold text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 text-sm ml-2 my-0.5">
            <span className="text-primary mt-0.5">•</span>
            <span className="flex-1">{renderInline(line.slice(2))}</span>
          </div>
        );
      }
      if (/^\d+\. /.test(line)) {
        const num = line.match(/^(\d+)\. /)?.[1];
        return (
          <div key={i} className="flex gap-2 text-sm ml-2 my-0.5">
            <span className="text-primary font-semibold min-w-[1rem]">{num}.</span>
            <span className="flex-1">{renderInline(line.replace(/^\d+\. /, ''))}</span>
          </div>
        );
      }
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm my-0.5">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <kbd key={i} className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {part.slice(1, -1)}
          </kbd>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-primary" />
          Help & Documentation
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          {totalArticles} articles across {SECTIONS.length} topics — search or browse below
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search docs... (e.g. GST, offline, quotation, shortcut)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2">
            {filteredSections.reduce((s, sec) => s + sec.articles.length, 0)} results
          </Badge>
        )}
      </div>

      {/* Quick Links Grid */}
      {!searchQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filteredSections.slice(0, 12).map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setExpandedSection(section.id);
                setTimeout(() => {
                  document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
            >
              <section.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">{section.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {filteredSections.map((section) => (
          <Card key={section.id} id={`section-${section.id}`} className="overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <section.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm sm:text-base">{section.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{section.description}</p>
              </div>
              <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                {section.articles.length}
              </Badge>
              {expandedSection === section.id ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {expandedSection === section.id && (
              <CardContent className="pt-0 pb-3 px-3 sm:px-4">
                <div className="border-t pt-2 space-y-1">
                  {section.articles.map((article) => (
                    <div key={article.id} className="rounded-lg border bg-card">
                      <button
                        onClick={() => toggleArticle(article.id)}
                        className="w-full flex items-center gap-2.5 p-2.5 sm:p-3 text-left hover:bg-accent/20 transition-colors rounded-lg"
                      >
                        {expandedArticle === article.id ? (
                          <ChevronDown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1">{article.title}</span>
                        {article.tags && (
                          <div className="hidden sm:flex items-center gap-1">
                            {article.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                      {expandedArticle === article.id && (
                        <div className="px-3 pb-3 pt-1 ml-6 border-t">
                          <div className="mt-2 space-y-0.5">{renderContent(article.content)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Footer */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5">
          <div className="text-center sm:text-left">
            <p className="font-medium">Can't find what you need?</p>
            <p className="text-sm text-muted-foreground">
              Press <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground mx-1">?</kbd> 
              for shortcuts or try the AI assistant in the bottom-right corner.
            </p>
          </div>
          <Link to="/settings">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors px-3 py-1.5">
              Restart Walkthrough →
            </Badge>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
