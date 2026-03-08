import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowRight,
  Globe,
  Printer,
  Mail,
  CreditCard,
  Shield,
  BarChart3,
  MousePointerClick,
  SlidersHorizontal,
  PlusCircle,
  Download,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  IndianRupee,
  QrCode,
  Share2,
  Moon,
  Sun,
  GripVertical,
  Filter,
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
}

interface DocArticle {
  id: string;
  title: string;
  content: string; // Supports markdown-ish formatting via our renderer
  tags?: string[];
}

const SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    icon: Zap,
    title: 'Getting Started',
    description: 'First-time setup and onboarding walkthrough',
    articles: [
      {
        id: 'gs-signup',
        title: 'Creating Your Account',
        tags: ['signup', 'register', 'account'],
        content: `1. Visit the **Sign Up** page and enter your email address and a strong password.\n2. Check your inbox for a **verification email** and click the confirmation link.\n3. Once verified, log in and you'll be taken to the **Onboarding** flow.\n\n> **Tip:** Use a business email so clients recognise you when they receive invoices.`,
      },
      {
        id: 'gs-onboarding',
        title: 'Onboarding – Setting Up Your Business',
        tags: ['onboarding', 'setup', 'business', 'profile'],
        content: `During onboarding you'll configure:\n\n• **Business Name** – appears on all invoices.\n• **State** – determines whether CGST+SGST or IGST applies.\n• **GSTIN** – your 15-digit GST Identification Number (optional but recommended).\n• **Invoice Prefix** – e.g. INV-, BILL-, or your own code.\n\nYou can change all of these later in **Settings**.`,
      },
      {
        id: 'gs-tour',
        title: 'Interactive Walkthrough Tour',
        tags: ['tour', 'tutorial', 'walkthrough', 'guide'],
        content: `A 6-step guided tour introduces you to every section:\n\n1. **Welcome** – overview of the platform.\n2. **Invoices** – how to create and manage bills.\n3. **Clients** – managing your customer directory.\n4. **Products** – inventory and product catalog.\n5. **Reports** – GST and revenue insights.\n6. **Keyboard Mastery** – power-user shortcuts.\n\n> You can **restart the tour** anytime from **Settings → Platform Walkthrough → Restart Tour**.`,
      },
      {
        id: 'gs-navigation',
        title: 'Navigating the App',
        tags: ['navigation', 'sidebar', 'menu'],
        content: `The **left sidebar** gives you one-click access to:\n\n• Dashboard\n• Invoices\n• Products\n• Clients\n• Reports\n• Settings\n\nOn **mobile**, tap the **☰ menu** icon in the header to open the sidebar.\n\nThe sidebar can be **collapsed** on desktop by clicking the **Collapse** button at the bottom – useful for wider invoice editing space.`,
      },
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Your business at a glance – stats, alerts, and activity',
    articles: [
      {
        id: 'dash-overview',
        title: 'Understanding the Dashboard',
        tags: ['dashboard', 'overview', 'stats'],
        content: `The dashboard displays four key metric cards:\n\n• **Total Revenue** – sum of all paid invoices (₹).\n• **Pending Amount** – total of unpaid finalized invoices.\n• **Total Invoices** – count of all invoices.\n• **Overdue Invoices** – invoices past their due date.\n\nBelow the metrics you'll find:\n• **Recent Invoices** – your latest 5 invoices with status badges.\n• **Low Stock Alerts** – products below their stock threshold.\n• **Activity Feed** – a chronological log of all actions taken.`,
      },
      {
        id: 'dash-low-stock',
        title: 'Low Stock Alerts',
        tags: ['low stock', 'inventory', 'alert', 'notification'],
        content: `Products whose **Stock Quantity** drops below their **Low Stock Limit** appear in a warning panel on the dashboard.\n\nEach alert shows the product name, current stock, and the threshold. Click the product name to jump directly to the Products page.\n\n> **Tip:** Set sensible low-stock limits when adding products to stay ahead of reorders.`,
      },
      {
        id: 'dash-activity',
        title: 'Activity Feed',
        tags: ['activity', 'log', 'history', 'audit'],
        content: `Every significant action is logged:\n\n• Invoice created / finalized / paid / cancelled\n• Client added / updated\n• Product added / stock adjusted\n\nThe feed shows **who** did **what** and **when**, giving you a full audit trail. This is especially useful for tracking changes if multiple people manage the account.`,
      },
    ],
  },
  {
    id: 'invoices',
    icon: FileText,
    title: 'Invoices',
    description: 'Create, manage, finalize, and share GST-compliant invoices',
    articles: [
      {
        id: 'inv-list',
        title: 'Invoice List & Filtering',
        tags: ['invoice', 'list', 'filter', 'search', 'sort'],
        content: `The **Invoices** page shows all your invoices in a searchable table.\n\n**Filters available:**\n• **Status** – Draft, Finalized, Paid, Cancelled\n• **Search** – by invoice number or client name\n• **Sort** – by date, amount, or status\n\n**Quick actions per row:**\n• Click the invoice number to **open and edit** it.\n• Use the action menu (⋯) to **view**, **edit**, **duplicate**, or **delete**.\n\n> **Shortcut:** Press \`/\` to focus the search input instantly.`,
      },
      {
        id: 'inv-create',
        title: 'Creating a New Invoice',
        tags: ['create', 'new', 'invoice', 'add'],
        content: `**Method 1:** Click the **+ New Invoice** button on the Invoices page.\n**Method 2:** Press \`N\` anywhere in the app.\n**Method 3:** Use ${modKey}+Shift+I to go to Invoices, then press \`A\`.\n\nThe editor opens with:\n• **Client selector** – pick an existing client or create one inline.\n• **Date issued** and **Due date** fields.\n• **Line items** section – add products or custom items.\n• **Notes** – free-text field that appears on the PDF.`,
      },
      {
        id: 'inv-line-items',
        title: 'Adding & Managing Line Items',
        tags: ['line items', 'products', 'quantity', 'rate', 'discount', 'tax'],
        content: `Each line item has:\n\n| Field | Description |\n|-------|-------------|\n| **Description** | Product name or custom text |\n| **Qty** | Quantity (defaults to 1) |\n| **Rate** | Price per unit (₹) |\n| **Discount** | Flat discount amount (₹) |\n| **Tax %** | GST rate (0%, 5%, 12%, 18%, 28%) |\n| **Amount** | Auto-calculated: (Qty × Rate − Discount) × (1 + Tax%) |\n\n**Adding items:**\n• Click **Add Item** or press ${modKey}+I.\n• Select a product from the dropdown to auto-fill rate & tax.\n• Or type a custom description and set values manually.\n\n**Reordering:** Drag the **⠿** handle on the left of any line item to reorder.\n\n**Removing:** Click the **🗑** icon on the right side of each item.`,
      },
      {
        id: 'inv-inline-create',
        title: 'Inline Client & Product Creation',
        tags: ['inline', 'quick add', 'client', 'product'],
        content: `You don't have to leave the invoice editor to add a new client or product.\n\n• In the **Client** dropdown, click **+ Create Client** to open a compact form right inside the editor.\n• In the **Product** dropdown for any line item, click **+ Create Product** to define a new product on the fly.\n\nAfter saving, the new client/product is immediately selectable in the same dropdown.`,
      },
      {
        id: 'inv-save-draft',
        title: 'Saving as Draft',
        tags: ['draft', 'save', 'auto-save'],
        content: `Press ${modKey}+S or click **Save Draft** to save the invoice without finalizing.\n\nDraft invoices:\n• Can be **edited freely** – change items, client, dates, etc.\n• Are **not numbered** with a final invoice number yet.\n• Do **not affect inventory** – stock is not deducted.\n• Show a **"Draft"** badge on the invoices list.`,
      },
      {
        id: 'inv-finalize',
        title: 'Finalizing an Invoice',
        tags: ['finalize', 'lock', 'invoice number', 'stock', 'inventory'],
        content: `Finalizing an invoice means:\n\n1. A **sequential invoice number** is generated (e.g. INW-0012).\n2. **Stock is deducted** for each product-linked line item.\n3. The invoice is **locked** – no further edits allowed.\n\nTo finalize: press ${modKey}+Enter or click the **Finalize** button.\n\nA confirmation dialog shows the **stock impact** – how many units of each product will be deducted.\n\n> **Important:** Finalization is irreversible. Make sure all details are correct before confirming.`,
      },
      {
        id: 'inv-payment',
        title: 'Marking as Paid',
        tags: ['paid', 'payment', 'mark paid', 'payment date', 'payment mode'],
        content: `Once an invoice is finalized, you can mark it as **Paid**:\n\n1. Open the finalized invoice.\n2. Click **Mark as Paid** in the header.\n3. The **payment date** is recorded as today's date.\n4. The status changes to **Paid** with a green badge.\n\nPaid invoices show in revenue calculations on the Dashboard and in Reports.`,
      },
      {
        id: 'inv-pdf',
        title: 'PDF Generation & Download',
        tags: ['pdf', 'download', 'print', 'export'],
        content: `Every invoice can be exported as a professional PDF.\n\n• Click the **PDF** button (or the download icon) in the invoice editor header.\n• The PDF includes:\n  - Your business logo and details\n  - Client billing information\n  - Itemized table with GST breakdown (CGST/SGST or IGST)\n  - Payment details (UPI VPA, bank account, IFSC)\n  - **QR Code** for UPI payment (if UPI VPA is set in Settings)\n  - Notes section\n\n> **Tip:** Add your logo and UPI VPA in Settings to make your PDFs look professional and payment-ready.`,
      },
      {
        id: 'inv-email',
        title: 'Emailing Invoices',
        tags: ['email', 'send', 'share', 'client'],
        content: `Click the **✉ Email** button to send the invoice directly to your client.\n\n• The client's email is pre-filled from their profile.\n• You can add a custom message.\n• The invoice is attached as a **PDF**.\n\n> The client must have an email address saved in their profile for this to work.`,
      },
      {
        id: 'inv-share',
        title: 'Sharing via Public Link',
        tags: ['share', 'link', 'public', 'view', 'token'],
        content: `Finalized invoices can be shared via a **unique public link**.\n\n• Click the **Share** button to generate/copy a shareable URL.\n• Anyone with the link can view the invoice (no login required).\n• The link contains a secure token – it cannot be guessed.\n\nThis is ideal for sending invoices via **WhatsApp, SMS, or any messaging app**.`,
      },
      {
        id: 'inv-split-view',
        title: 'Split-View PDF Preview',
        tags: ['preview', 'split', 'side-by-side', 'live'],
        content: `On larger screens, toggle the **Preview** pane (${modKey}+P) to see a **live PDF preview** side-by-side with the editor.\n\nAs you add items, change quantities, or update the client, the preview updates in real-time. This helps you catch formatting issues before finalizing.`,
      },
      {
        id: 'inv-cancel',
        title: 'Cancelling an Invoice',
        tags: ['cancel', 'void', 'delete'],
        content: `• **Draft invoices** can be **deleted** entirely from the action menu.\n• **Finalized invoices** can be **cancelled** – they receive a "Cancelled" status but remain in the system for audit purposes.\n\n> Cancelled invoices do not count toward revenue or pending amounts.`,
      },
    ],
  },
  {
    id: 'products',
    icon: Package,
    title: 'Products & Inventory',
    description: 'Manage your product catalog, stock levels, and HSN codes',
    articles: [
      {
        id: 'prod-list',
        title: 'Product List',
        tags: ['products', 'list', 'catalog', 'search'],
        content: `The Products page displays all your products and services in a table.\n\n**Columns shown:**\n• Name, SKU, Type (Product/Service), Selling Price, Tax Rate, Stock Qty\n\n**Actions:**\n• **Search** – filter by name or SKU (press \`/\` to focus)\n• **Add** – press \`A\` or click **+ Add Product**\n• **Edit** – click any product row to open the edit dialog\n• **Delete** – from the action menu\n\n> Products marked as **Service** type don't track stock quantities.`,
      },
      {
        id: 'prod-add',
        title: 'Adding a Product',
        tags: ['add', 'create', 'product', 'sku', 'hsn'],
        content: `Fill in these fields:\n\n• **Name** – product display name.\n• **SKU** – unique stock keeping unit code.\n• **Type** – Product (has inventory) or Service (no stock tracking).\n• **Selling Price** – default rate in ₹.\n• **Tax Rate** – GST percentage (0, 5, 12, 18, or 28%).\n• **HSN Code** – Harmonized System of Nomenclature code for GST classification.\n• **Stock Quantity** – current units in hand.\n• **Low Stock Limit** – alert threshold.\n• **Description** – optional product details.\n\n> When you select this product on an invoice, the **rate** and **tax%** auto-fill from here.`,
      },
      {
        id: 'prod-stock',
        title: 'Stock Management & Restock',
        tags: ['stock', 'inventory', 'restock', 'quantity', 'adjustment'],
        content: `Stock changes happen in two ways:\n\n**Automatic (on invoice finalization):**\n• When an invoice is finalized, stock is **deducted** for each product-linked line item by the quantity on the invoice.\n\n**Manual (Restock):**\n• Open a product and click **Restock**.\n• Enter the quantity to add and a reason (e.g. "Purchased from supplier").\n• The change is logged in the **Inventory Log**.\n\nAll stock movements are tracked with timestamps, amounts, and reasons for full traceability.`,
      },
      {
        id: 'prod-inventory-log',
        title: 'Inventory Log',
        tags: ['inventory log', 'history', 'stock history', 'audit'],
        content: `Every stock change is recorded:\n\n• **Change Amount** – positive (restock) or negative (invoice deduction)\n• **Reason** – why the change happened\n• **Reference** – linked invoice number (for auto-deductions)\n• **Timestamp** – exact date and time\n\nThis gives you a complete audit trail for every product.`,
      },
    ],
  },
  {
    id: 'clients',
    icon: Users,
    title: 'Clients',
    description: 'Maintain your customer directory with GST and billing details',
    articles: [
      {
        id: 'cli-list',
        title: 'Client Directory',
        tags: ['clients', 'list', 'directory', 'search'],
        content: `The Clients page shows all your customers with:\n\n• **Name**, **Email**, **Phone**\n• **GSTIN** – for B2B invoices\n• **State** – determines GST type (intra-state vs inter-state)\n• **Credit Balance** – outstanding amount\n\nUse **Search** (\`/\`) to find clients quickly. Press \`A\` to add a new client.`,
      },
      {
        id: 'cli-add',
        title: 'Adding a Client',
        tags: ['add', 'create', 'client', 'customer'],
        content: `Required: **Name** and **State Code**.\n\nOptional but recommended:\n• **Email** – needed for email invoice delivery.\n• **Phone** – for contact and future SMS features.\n• **GSTIN** – for B2B compliance.\n• **Billing Address** – appears on invoice PDFs.\n\n> You can also create clients **inline** while editing an invoice – no need to leave the editor.`,
      },
      {
        id: 'cli-gst',
        title: 'GST Handling Based on State',
        tags: ['gst', 'cgst', 'sgst', 'igst', 'inter-state', 'intra-state'],
        content: `The app automatically determines the correct GST split:\n\n• **Same state** (your state = client's state) → **CGST + SGST** (tax split 50/50)\n• **Different state** → **IGST** (full tax rate)\n\nThis is calculated based on the **State Code** in your Settings vs the client's state code. Make sure both are set correctly for accurate invoices.`,
      },
      {
        id: 'cli-credit',
        title: 'Client Credit Balance',
        tags: ['credit', 'balance', 'outstanding', 'receivable'],
        content: `Each client has a **Credit Balance** field showing outstanding receivables.\n\nThis helps you track which clients owe you money at a glance from the clients list.`,
      },
    ],
  },
  {
    id: 'reports',
    icon: TrendingUp,
    title: 'Reports & Analytics',
    description: 'GST summaries, revenue charts, and data exports',
    articles: [
      {
        id: 'rep-gst',
        title: 'GST Report',
        tags: ['gst', 'report', 'tax', 'cgst', 'sgst', 'igst', 'filing'],
        content: `The GST Report gives you a monthly summary with:\n\n• **Total Taxable Amount** – sum of all invoice subtotals.\n• **CGST Collected** – Central GST.\n• **SGST Collected** – State GST.\n• **IGST Collected** – Integrated GST.\n• **Total Tax** – combined tax collected.\n\nFilter by **date range** to match your GST filing period.\n\n> This report helps you fill your **GSTR-3B** return accurately.`,
      },
      {
        id: 'rep-revenue',
        title: 'Revenue Analytics',
        tags: ['revenue', 'analytics', 'chart', 'graph', 'trend'],
        content: `Visual charts show:\n\n• **Monthly revenue trend** – bar or line chart.\n• **Invoice status distribution** – Draft / Finalized / Paid / Cancelled.\n• **Top clients by revenue** – who brings in the most business.\n\nUse these to identify seasonal patterns and growth trends.`,
      },
      {
        id: 'rep-export',
        title: 'CSV Export',
        tags: ['csv', 'export', 'download', 'excel', 'data'],
        content: `Export your data as **CSV files** for use in Excel, Google Sheets, or Tally.\n\nAvailable exports:\n• **Invoices** – all invoices with amounts, dates, and status.\n• **Products** – complete product catalog with stock levels.\n• **Clients** – customer directory.\n\n> Useful for sharing data with your **CA (Chartered Accountant)** or importing into other accounting software.`,
      },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings & Configuration',
    description: 'Business profile, payment details, invoice numbering, and notifications',
    articles: [
      {
        id: 'set-business',
        title: 'Business Profile',
        tags: ['business', 'profile', 'logo', 'gstin', 'pan', 'address'],
        content: `Under **Settings → Business**, configure:\n\n• **Business Logo** – upload your logo (appears on PDFs).\n• **Business Name** – your company or firm name.\n• **Email & Phone** – contact details on invoices.\n• **GSTIN** – 15-digit GST Identification Number.\n• **PAN** – Permanent Account Number.\n• **State** – your registered business state.\n• **Address** – full address printed on invoices.\n\nAll changes reflect immediately on new invoices.`,
      },
      {
        id: 'set-payment',
        title: 'Payment Details (UPI & Bank)',
        tags: ['upi', 'bank', 'payment', 'qr code', 'ifsc', 'account number'],
        content: `Under **Settings → Business → Payment Details**:\n\n• **UPI VPA** (e.g. yourname@upi) – enables **QR code generation** on invoice PDFs.\n• **Bank Account Name** – account holder name.\n• **Bank Account Number** – your bank account.\n• **IFSC Code** – your bank's IFSC.\n\nWhen UPI VPA is set, every PDF invoice gets a scannable **UPI QR code** that clients can use to pay instantly via any UPI app (GPay, PhonePe, Paytm, etc.).`,
      },
      {
        id: 'set-invoice',
        title: 'Invoice Numbering',
        tags: ['invoice number', 'prefix', 'sequence', 'numbering'],
        content: `Under **Settings → Invoice**:\n\n• **Invoice Prefix** – text before the number (e.g. INW-, INV-, BILL-).\n• **Next Invoice Number** – the next sequential number to be assigned.\n\nA **live preview** shows how the next invoice number will look (e.g. INW-0012).\n\n> Numbers are auto-incremented on finalization. You can adjust the next number if needed (e.g. after a financial year reset).`,
      },
      {
        id: 'set-notifications',
        title: 'Notification Preferences',
        tags: ['notifications', 'alerts', 'toast', 'preferences'],
        content: `Under **Settings → Notifications**, toggle:\n\n• **Toast Popups** – real-time popup notifications.\n• **Low Stock Alerts** – notifications when products are below threshold.\n• **Invoice Events** – created, finalized, paid, cancelled updates.\n• **Client Events** – new client notifications.\n\nEven if popups are off, notifications still appear in the **🔔 Notification Bell** in the header.`,
      },
    ],
  },
  {
    id: 'search-shortcuts',
    icon: Keyboard,
    title: 'Search & Keyboard Shortcuts',
    description: 'Global search, navigation shortcuts, and productivity tips',
    articles: [
      {
        id: 'kb-global-search',
        title: 'Global Search (⌘K)',
        tags: ['search', 'global', 'command', 'find', 'quick'],
        content: `Press **${modKey}+K** to open the **Global Search** palette.\n\nFrom here you can:\n• Search for **invoices** by number or client name.\n• Search for **clients** by name.\n• Search for **products** by name or SKU.\n• Jump to any **page** (Dashboard, Settings, etc.).\n\nResults update as you type. Press **Enter** to navigate to the selected result, or **Esc** to close.`,
      },
      {
        id: 'kb-navigation',
        title: 'Navigation Shortcuts',
        tags: ['shortcut', 'keyboard', 'navigation', 'hotkey'],
        content: `**Page Navigation** (works from anywhere):\n\n| Shortcut | Action |\n|----------|--------|\n| ${modKey}+Shift+D | Go to Dashboard |\n| ${modKey}+Shift+I | Go to Invoices |\n| ${modKey}+Shift+P | Go to Products |\n| ${modKey}+Shift+C | Go to Clients |\n| ${modKey}+Shift+R | Go to Reports |\n| ${modKey}+Shift+S | Go to Settings |\n| N | New Invoice |\n| T | Toggle Theme (Light/Dark) |\n| ? | Open Shortcuts Dialog |`,
      },
      {
        id: 'kb-page-shortcuts',
        title: 'Page-Specific Shortcuts',
        tags: ['shortcut', 'page', 'list', 'editor', 'context'],
        content: `**On List Pages** (Invoices, Clients, Products):\n\n| Shortcut | Action |\n|----------|--------|\n| / | Focus search input |\n| A | Open "Add New" dialog |\n\n**In Invoice Editor:**\n\n| Shortcut | Action |\n|----------|--------|\n| ${modKey}+S | Save Draft |\n| ${modKey}+Enter | Finalize Invoice |\n| ${modKey}+P | Toggle PDF Preview |\n| ${modKey}+I | Add Line Item |\n| Esc | Close dialogs / deselect |`,
      },
      {
        id: 'kb-shortcuts-dialog',
        title: 'Shortcuts Quick Reference',
        tags: ['shortcuts', 'reference', 'dialog', 'help'],
        content: `Press **?** anywhere in the app to open the **Keyboard Shortcuts Dialog** – a floating reference card showing all available shortcuts.\n\nShortcuts are grouped by:\n• **Navigation** – moving between pages\n• **General** – theme, search, help\n• **List Pages** – search and add actions\n• **Invoice Editor** – save, finalize, preview\n\nThe sidebar also shows shortcut badges next to each menu item for quick reference.`,
      },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Real-time alerts for invoices, stock, and client activity',
    articles: [
      {
        id: 'notif-bell',
        title: 'Notification Bell',
        tags: ['notifications', 'bell', 'badge', 'unread'],
        content: `The **🔔** icon in the header shows your unread notification count.\n\nClick it to see a dropdown of recent notifications. Each notification shows:\n• **Title** – what happened.\n• **Message** – details of the event.\n• **Time** – when it occurred.\n\nClick a notification to navigate to the relevant page (e.g. clicking an invoice notification opens that invoice). Notifications are automatically marked as read when viewed.`,
      },
      {
        id: 'notif-types',
        title: 'Notification Types',
        tags: ['notification types', 'low stock', 'invoice', 'client'],
        content: `The system generates notifications for:\n\n• **📦 Low Stock** – when a product falls below its low stock limit after an invoice deduction.\n• **📄 Invoice Events** – invoice created, finalized, marked as paid, or cancelled.\n• **👤 Client Events** – new client added.\n\nEach type can be individually toggled in **Settings → Notifications**.`,
      },
    ],
  },
  {
    id: 'theme',
    icon: Moon,
    title: 'Theme & Appearance',
    description: 'Light mode, dark mode, and theme customization',
    articles: [
      {
        id: 'theme-toggle',
        title: 'Switching Between Light & Dark Mode',
        tags: ['theme', 'dark mode', 'light mode', 'toggle', 'appearance'],
        content: `**Three ways to toggle the theme:**\n\n1. Press **T** on your keyboard.\n2. Click the **🌙/☀** icon in the header.\n3. The app also respects your **system preference** on first load.\n\nThe theme is saved and persists across sessions. All UI elements, charts, and PDF previews adapt to the selected theme.`,
      },
    ],
  },
  {
    id: 'gst-compliance',
    icon: Shield,
    title: 'GST Compliance (India)',
    description: 'Understanding CGST, SGST, IGST, HSN codes, and tax calculations',
    articles: [
      {
        id: 'gst-basics',
        title: 'How GST Works in the App',
        tags: ['gst', 'tax', 'india', 'cgst', 'sgst', 'igst'],
        content: `The app handles Indian GST automatically:\n\n**Tax Determination:**\n• Your state is set in **Settings → Business → State**.\n• Each client has their own **State Code**.\n• If both states match → **Intra-state** → CGST + SGST (tax split 50-50).\n• If states differ → **Inter-state** → IGST (full rate).\n\n**Tax Rates:** 0%, 5%, 12%, 18%, 28% – set per product.\n\n**On Invoice PDF:**\n• A clear breakdown shows Taxable Amount, CGST, SGST (or IGST), and Total.\n• HSN codes are printed alongside each line item for compliance.`,
      },
      {
        id: 'gst-hsn',
        title: 'HSN Codes',
        tags: ['hsn', 'code', 'classification', 'gst'],
        content: `**HSN (Harmonized System of Nomenclature)** codes classify goods for GST.\n\n• Add the HSN code when creating a product.\n• The code appears on invoice PDFs for compliance.\n• Required for businesses with turnover above ₹5 crore.\n\n> Look up HSN codes on the **CBIC website** or ask your CA for the correct codes for your products.`,
      },
      {
        id: 'gst-calculation',
        title: 'Tax Calculation Formula',
        tags: ['calculation', 'formula', 'tax', 'amount', 'discount'],
        content: `Each line item amount is calculated as:\n\n**Amount = (Quantity × Rate − Discount) × (1 + Tax Rate / 100)**\n\nExample:\n• Qty: 10, Rate: ₹500, Discount: ₹200, Tax: 18%\n• Taxable: (10 × 500 − 200) = ₹4,800\n• Tax: ₹4,800 × 18% = ₹864\n• Amount: ₹4,800 + ₹864 = **₹5,664**\n\nThe invoice totals show:\n• **Subtotal** – sum of all taxable amounts (before tax).\n• **Total Discount** – sum of all line item discounts.\n• **Total Tax** – sum of all tax amounts.\n• **Grand Total** – final payable amount.`,
      },
    ],
  },
  {
    id: 'tips',
    icon: HelpCircle,
    title: 'Tips & Best Practices',
    description: 'Pro tips to get the most out of the platform',
    articles: [
      {
        id: 'tip-workflow',
        title: 'Recommended Invoice Workflow',
        tags: ['workflow', 'best practice', 'process', 'tips'],
        content: `Follow this flow for error-free invoicing:\n\n1. **Set up products first** – add your catalog with correct rates and tax.\n2. **Add your clients** – with GSTIN and state codes.\n3. **Create invoice** → select client → add line items from products.\n4. **Save as Draft** → review in split-view preview.\n5. **Finalize** → stock is deducted, invoice number assigned.\n6. **Share** → download PDF, email, or send public link via WhatsApp.\n7. **Mark as Paid** → when payment is received.\n\n> This workflow ensures accurate stock tracking, proper GST calculation, and a clean audit trail.`,
      },
      {
        id: 'tip-services',
        title: 'Services vs Products',
        tags: ['service', 'product', 'type', 'stock'],
        content: `Use **Product** type for physical goods that need stock tracking.\nUse **Service** type for labour, consulting, design work, etc.\n\n**Key difference:** Services don't have stock quantities, so they won't trigger low-stock alerts or stock deductions on finalization.`,
      },
      {
        id: 'tip-backup',
        title: 'Exporting Data for Backup',
        tags: ['backup', 'export', 'csv', 'data safety'],
        content: `Regularly export your data from the **Reports** page:\n\n• Export **Invoices** as CSV for your records.\n• Export **Clients** and **Products** for backup.\n\nCSV files can be opened in Excel or Google Sheets and serve as an offline backup of your business data.`,
      },
      {
        id: 'tip-mobile',
        title: 'Using on Mobile',
        tags: ['mobile', 'responsive', 'phone', 'tablet'],
        content: `The app is fully responsive and works on phones and tablets.\n\n**Mobile tips:**\n• Use the **hamburger menu** (☰) to access the sidebar.\n• Invoice editor uses a single-column layout on mobile.\n• Tap the **+ New Invoice** button for quick billing.\n• Global search works via the search icon in the header.\n\n> For the best experience creating detailed invoices, we recommend using a tablet or desktop.`,
      },
      {
        id: 'tip-qr',
        title: 'UPI QR Code on Invoices',
        tags: ['qr', 'upi', 'payment', 'scan', 'gpay', 'phonepe'],
        content: `To enable **UPI QR codes** on your PDF invoices:\n\n1. Go to **Settings → Business → Payment Details**.\n2. Enter your **UPI VPA** (e.g. business@upi).\n3. Save changes.\n\nEvery PDF invoice will now include a scannable QR code. Your client can scan it with **Google Pay, PhonePe, Paytm**, or any UPI app to pay the exact invoice amount instantly.\n\n> This dramatically speeds up payment collection – no more sharing bank details manually!`,
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

  // Filter articles by search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.map((section) => ({
      ...section,
      articles: section.articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
      ),
    })).filter((s) => s.articles.length > 0);
  }, [searchQuery]);

  const totalArticles = SECTIONS.reduce((sum, s) => sum + s.articles.length, 0);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const toggleArticle = (id: string) => {
    setExpandedArticle((prev) => (prev === id ? null : id));
  };

  // Simple markdown-ish renderer
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle table rows
      if (line.startsWith('|')) {
        const cells = line.split('|').filter(Boolean).map((c) => c.trim());
        if (cells.every((c) => c.match(/^[-]+$/))) return null; // separator row
        const isHeader = i > 0 && text.split('\n')[i + 1]?.includes('---');
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
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <div key={i} className="border-l-2 border-primary/40 pl-3 py-1 my-2 text-sm text-muted-foreground italic bg-primary/5 rounded-r">
            {renderInline(line.slice(2))}
          </div>
        );
      }
      // Heading
      if (line.startsWith('**') && line.endsWith('**') && !line.includes('**', 2)) {
        return <p key={i} className="font-semibold text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      // Bullet
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 text-sm ml-2 my-0.5">
            <span className="text-primary mt-0.5">•</span>
            <span>{renderInline(line.slice(2))}</span>
          </div>
        );
      }
      // Numbered
      if (/^\d+\. /.test(line)) {
        const num = line.match(/^(\d+)\. /)?.[1];
        return (
          <div key={i} className="flex gap-2 text-sm ml-2 my-0.5">
            <span className="text-primary font-semibold min-w-[1rem]">{num}.</span>
            <span>{renderInline(line.replace(/^\d+\. /, ''))}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) return <div key={i} className="h-2" />;
      // Normal text
      return <p key={i} className="text-sm my-0.5">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    // Process bold, code, and links
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
          Everything you need to know about using the platform — {totalArticles} articles across {SECTIONS.length} topics
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search documentation... (e.g. GST, PDF, shortcut, invoice)"
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

      {/* Quick Links */}
      {!searchQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SECTIONS.slice(0, 8).map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setExpandedSection(section.id);
                document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
            >
              <section.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{section.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {filteredSections.map((section) => (
          <Card key={section.id} id={`section-${section.id}`} className="overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-accent/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <section.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base">{section.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
              </div>
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {section.articles.length}
              </Badge>
              {expandedSection === section.id ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {expandedSection === section.id && (
              <CardContent className="pt-0 pb-4 px-4 md:px-5 space-y-1">
                <div className="border-t pt-3 space-y-1">
                  {section.articles.map((article) => (
                    <div key={article.id} className="rounded-lg border bg-card">
                      <button
                        onClick={() => toggleArticle(article.id)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/20 transition-colors rounded-lg"
                      >
                        {expandedArticle === article.id ? (
                          <ChevronDown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1">{article.title}</span>
                        {article.tags && (
                          <div className="hidden sm:flex items-center gap-1">
                            {article.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                      {expandedArticle === article.id && (
                        <div className="px-3 pb-4 pt-1 ml-6 border-t">
                          <div className="mt-3 space-y-0.5">{renderContent(article.content)}</div>
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
            <p className="font-medium">Can't find what you're looking for?</p>
            <p className="text-sm text-muted-foreground">
              Press <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground mx-1">?</kbd> 
              for keyboard shortcuts or explore the platform with the guided tour.
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
