# Inw Invoices - Complete Feature Documentation

**Intelligent Invoicing & Inventory Workspace**  
A comprehensive SaaS platform for Indian SMBs (Tier 2 & Tier 3 businesses)

---

## 📑 Table of Contents

1. [Core Platform](#core-platform)
2. [Authentication & Security](#authentication--security)
3. [Invoicing System](#invoicing-system)
4. [Quotations](#quotations)
5. [Purchase Orders](#purchase-orders)
6. [Purchase Bills](#purchase-bills)
7. [Delivery Challans](#delivery-challans)
8. [Recurring Invoices](#recurring-invoices)
9. [Products & Inventory](#products--inventory)
10. [Client Management](#client-management)
11. [Reports & Analytics](#reports--analytics)
12. [GST & Tax Compliance](#gst--tax-compliance)
13. [PDF Generation](#pdf-generation)
14. [Communication & Sharing](#communication--sharing)
15. [Dashboard](#dashboard)
16. [Settings & Configuration](#settings--configuration)
17. [Internationalization (i18n)](#internationalization-i18n)
18. [Accessibility (a11y)](#accessibility-a11y)
19. [Keyboard Shortcuts](#keyboard-shortcuts)
20. [AI Assistant](#ai-assistant)
21. [Admin Panel](#admin-panel)
22. [Performance Optimizations](#performance-optimizations)
23. [Technical Stack](#technical-stack)

---

## Core Platform

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query + Zustand
- **Backend**: Lovable Cloud (Supabase)
- **PDF Generation**: @react-pdf/renderer
- **Email**: Resend integration via Edge Functions

### Architecture
- Single Page Application (SPA) with React Router
- Lazy-loaded route components for optimal bundle splitting
- Protected routes with authentication guards
- Module-based feature toggling (enable/disable features per user)

---

## Authentication & Security

### User Authentication
- **Email/Password signup and login**
- **Email verification** (required before sign-in)
- **Password reset flow** via email link
- **Persistent sessions** with automatic token refresh
- **Secure logout** with session cleanup

### Security Features
- **Row Level Security (RLS)** on all database tables
- **Profile-based data isolation** (multi-tenant architecture)
- **Secure share tokens** for public invoice viewing
- **Role-based access control** (admin/user roles)
- **Security definer functions** for privileged operations

### Onboarding Flow
5-step guided onboarding for new users:
1. Business Info (Organization name, type selection)
2. Tax/PAN details (GSTIN, PAN number)
3. Payment/Bank details (UPI, Bank account)
4. Invoice Setup (Prefix, starting number)
5. Welcome Summary

---

## Invoicing System

### Invoice Management
- **Create, edit, and delete invoices**
- **Draft → Finalized → Paid workflow**
- **Auto-generated invoice numbers** with customizable prefix
- **Duplicate invoice functionality**
- **Cancel invoices** with audit trail

### Invoice Editor
- **Split-screen layout**: Editor on left, live PDF preview on right
- **Drag-and-drop line item reordering** (via @dnd-kit)
- **Inline client creation** (Quick Add without leaving editor)
- **Inline product creation** with auto-SKU generation
- **Inline restock** for low-stock products
- **Real-time calculations** (subtotal, tax, discounts, grand total)

### Line Items
- **Product selection** from inventory
- **Custom line items** (manual description/rate)
- **Quantity and rate editing**
- **Per-item discount** (percentage)
- **Per-item tax rate** (GST: 0%, 5%, 12%, 18%, 28%)
- **Sortable order** via drag handles

### Invoice Totals
- **Subtotal calculation**
- **Total discount amount**
- **Tax breakdown** (CGST/SGST for intra-state, IGST for inter-state)
- **Grand total** with automatic rounding
- **Amount in words** (Indian numbering system)

### Finalization
- **Stock impact preview** before finalizing
- **Automatic inventory deduction** on finalization
- **Invoice number locking** after finalization
- **Payment recording** with date, mode, and reference

### Payment Modes
- Cash
- UPI
- Credit (Udhaar)
- Split payment
- Cheque
- NEFT
- RTGS

---

## Quotations

### Quotation Features
- **Create and manage quotations**
- **Validity period** (Valid Until date)
- **Terms & conditions** field
- **Convert quotation to invoice** (one-click)
- **Status tracking**: Draft, Sent, Accepted, Rejected, Converted

### Quotation Editor
- Same powerful editor as invoices
- Client selection with inline creation
- Product selection with quantities
- PDF preview and download

---

## Purchase Orders

### PO Management
- **Create purchase orders for suppliers**
- **Supplier details** (Name, GSTIN, Address)
- **Expected delivery date** tracking
- **Status workflow**: Draft → Sent → Received → Cancelled
- **Auto-generated PO numbers**

### PO Features
- Line items with products, quantities, rates
- Tax calculations
- Notes field
- PDF generation and download

---

## Purchase Bills

### Bill Management
- **Record supplier invoices/bills**
- **Link to purchase orders**
- **Bill date and received date**
- **Batch tracking** for inventory items

### Bill Finalization
- **Automatic stock addition** to inventory
- **Batch number and expiry date** recording
- **Product batch creation** for traceability

---

## Delivery Challans

### Challan Features
- **Create delivery challans** for goods dispatch
- **Link to invoices** (optional)
- **Transport details**:
  - Vehicle number
  - Transport mode (Road, Rail, Air, Ship)
  - Dispatch from/to addresses
- **Status tracking**: Draft, Dispatched, Delivered, Cancelled

### Challan Items
- Product selection
- Quantity tracking
- Sortable line items

---

## Recurring Invoices

### Template Management
- **Create recurring invoice templates**
- **Frequency options**: Weekly, Monthly, Quarterly, Yearly
- **Active/Inactive toggle**
- **Next generation date** display

### Automation
- **Auto-generate invoices** on schedule
- **Client selection** for recurring billing
- **Template items** with products, rates, and taxes

---

## Products & Inventory

### Product Management
- **Add, edit, and delete products**
- **Product types**: Goods (physical) or Service
- **SKU management** with auto-generation
- **Barcode support** (custom barcodes)
- **HSN/SAC codes** for GST compliance

### Pricing & Tax
- **Selling price** configuration
- **Tax rate selection** (0%, 5%, 12%, 18%, 28%)
- **Custom tax rates** support

### Inventory Tracking
- **Stock quantity** management
- **Low stock alerts** with configurable threshold
- **Stock adjustments** with reason codes:
  - Invoice deduction (automatic)
  - Restock (manual/purchase bill)
  - Correction (manual adjustment)

### Batch Tracking
- **Product batches** with unique batch numbers
- **Expiry date tracking** for perishables
- **Expiring batches alert** on dashboard
- **Link batches to purchase bills**

### Supplier Defaults
- **Default supplier name** per product
- **Default supplier GSTIN** for quick PO creation

### Barcode Scanner
- **Camera-based barcode scanning** (html5-qrcode)
- **Quick product lookup** by barcode
- **Add scanned products** to invoices

---

## Client Management

### Client Features
- **Add, edit, and delete clients**
- **Client details**:
  - Name
  - Email
  - Phone
  - Billing address
  - GSTIN
  - State code (for GST calculation)

### Credit System (Udhaar)
- **Credit balance tracking** per client
- **Outstanding amount** monitoring
- **Credit payments** recording

---

## Reports & Analytics

### Overview Dashboard
- **This Month Revenue** with growth percentage
- **Outstanding Amount** (unpaid invoices)
- **Overdue Amount** (past due date)
- **Due This Week** forecast

### Revenue Chart
- **6-month bar chart** showing:
  - Monthly revenue
  - Monthly tax collected
- Interactive tooltips with INR formatting

### Report Types

#### GST Report
- **GSTR-1 ready analytics**
- **Filter by period**: Monthly, Quarterly
- **Indian financial year** alignment (April-March)
- **Summaries by**:
  - GST slab (0%, 5%, 12%, 18%, 28%)
  - HSN/SAC code
  - State-wise breakdown
- **CSV export** with multiple sections

#### GSTR-3B Export
- **Summary export** for GST filing
- **Taxable value breakdown**
- **CGST/SGST/IGST** totals

#### Profit & Loss Report
- **Revenue calculation**
- **Expense tracking** (purchase bills)
- **Net profit/loss**
- **Period comparison**

#### Cash Flow Forecast
- **Projected income** from finalized invoices
- **Due date-based** forecasting
- **Visual timeline**

#### Party Ledger
- **Client-wise transaction history**
- **Invoice and payment records**
- **Running balance**

#### TDS Management
- **TDS entry recording**
- **Section codes** (194C, 194J, etc.)
- **Certificate tracking**
- **Quarterly grouping**
- **Financial year filtering**

### Export Features
- **CSV export** for all invoice data
- **GST report CSV** with comprehensive breakdown
- **Filtered exports** based on date range

---

## GST & Tax Compliance

### GST Calculation
- **Automatic state detection** from profile and client
- **Intra-state transactions**: CGST + SGST (split equally)
- **Inter-state transactions**: IGST (full rate)

### State Codes
- **All 38 Indian state codes** supported
- **Automatic GST type determination**

### Tax Rates
- **Standard GST slabs**: 0%, 5%, 12%, 18%, 28%
- **Per-item tax rate** configuration
- **Tax breakdown** on invoices

### Compliance Features
- **GSTIN validation**
- **HSN/SAC code support**
- **GSTR-1 ready reports**
- **GSTR-3B summaries**

---

## PDF Generation

### Invoice PDF Features
- **Professional templates** with consistent branding
- **Light-mode teal theme** (independent of app theme)
- **Plus Jakarta Sans** typography
- **Business details**:
  - Logo
  - Organization name
  - GSTIN
  - Address
  - Contact info

### PDF Content
- **Invoice header** with number and date
- **Client details** section
- **Line items table** with:
  - Description
  - HSN/SAC code
  - Quantity
  - Rate
  - Tax rate
  - Amount
- **Alternating row colors**
- **Tax breakdown** (CGST/SGST/IGST)
- **Grand total** with amount in words

### Payment Information
- **Bank details** (Account name, number, IFSC)
- **UPI ID** display
- **Dynamic QR code** for UPI payments
- **Configurable visibility** toggle

### Additional PDFs
- **Quotation PDF** (similar to invoice)
- **Purchase Order PDF**
- **Delivery Challan PDF**

### Download Features
- **Direct PDF download**
- **Filename**: `{type}-{number}.pdf`
- **Blob generation** with @react-pdf/renderer

---

## Communication & Sharing

### Email Integration
- **Send invoices via email** (Resend)
- **Customizable email subject/body**
- **PDF attachment**
- **Email dialog** with recipient selection

### WhatsApp Sharing
- **Share via WhatsApp** button
- **Pre-filled message** with invoice details
- **Public link** to view invoice

### Public Invoice View
- **Token-based secure links**
- **No login required** for clients
- **View and download** PDF
- **Responsive design** for mobile

### Payment Reminders
- **Send payment reminders** via WhatsApp
- **Pre-formatted reminder message**
- **Outstanding amount** included

---

## Dashboard

### Statistics Cards
- **Total Revenue** (paid invoices)
- **Pending Amount** (finalized, unpaid)
- **Total Invoices** count
- **Low Stock Items** count

### Recent Activity Tabs
- **Recent Invoices** (latest 5)
- **Recent Quotations** (if module enabled)
- **Recent Challans** (if module enabled)
- **Recent Purchase Orders** (if module enabled)

### Alerts & Widgets
- **Low Stock Alert** with product list
- **Expiring Batches Alert** (configurable days)
- **Low Stock Auto-PO** suggestion
- **Activity Feed** (recent actions)
- **Announcement Banner** (admin messages)

### Quick Actions
- **New Invoice** button
- **Direct links** to recent documents

---

## Settings & Configuration

### Business Settings Tab
- **Organization name**
- **Email and phone**
- **Address**
- **Logo upload** (with preview)
- **Language selection** (EN/HI/BN)

### Tax Settings Tab
- **GSTIN**
- **PAN number**
- **State code** selection

### Payment Settings Tab
- **UPI VPA** (for QR code)
- **Bank account name**
- **Bank account number**
- **Bank IFSC code**
- **Digital signature** upload

### Invoice Settings Tab
- **Invoice prefix** (e.g., INW-)
- **Next invoice number** (starting point)
- **Quotation prefix**

### Notifications Tab
- **Low stock alerts** toggle
- **Overdue invoice reminders** toggle
- **Payment received alerts** toggle

### Modules Tab
- **Enable/disable modules**:
  - Quick Bill (POS)
  - Quotations
  - Delivery Challans
  - Purchase Orders
  - Recurring Invoices
  - Reports & Analytics
- **Per-module toggle** switches

### Accessibility Tab
- **Font size slider** (14px - 24px)
- **High contrast mode** toggle
- **Reduced motion** toggle
- **Large touch targets** toggle
- **Reset to defaults** button
- **Keyboard shortcuts** reference

### Onboarding
- **Restart tutorial** option
- **Keyboard hints** toggle

---

## Internationalization (i18n)

### Supported Languages
- **English** (en) - Default
- **Hindi** (hi) - हिन्दी
- **Bengali** (bn) - বাংলা

### Implementation
- **LanguageProvider** context
- **Translation function** `t(key)`
- **localStorage persistence**
- **Language selector** in settings

### Translated Elements
- Navigation labels
- Dashboard statistics
- Settings sections
- Status indicators
- Button labels
- Form labels

---

## Accessibility (a11y)

### Visual Accessibility
- **Adjustable font size** (14px to 24px)
- **High contrast mode** (increased color contrast)
- **Reduced motion** (disables animations)
- **Large touch targets** (48px minimum)

### Keyboard Accessibility
- **Skip to main content** link
- **Focus visible outlines** on all interactive elements
- **Tab navigation** through entire app
- **Escape key** to dismiss dialogs

### Screen Reader Support
- **ARIA landmarks** (banner, main, navigation)
- **ARIA labels** on icon-only buttons
- **Role attributes** (button, tab, region, status)
- **aria-current** for active navigation
- **aria-expanded** for collapsible elements
- **aria-hidden** on decorative icons
- **Live regions** for dynamic updates

### Semantic HTML
- Proper heading hierarchy
- Button vs link distinction
- Form labels and descriptions
- Table headers and captions

---

## Keyboard Shortcuts

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Open global search |
| `?` | Open help dialog |
| `T` | Toggle theme (light/dark) |
| `Esc` | Close dialog / Blur focus |

### Navigation
| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + Shift + D` | Go to Dashboard |
| `⌘/Ctrl + Shift + I` | Go to Invoices |
| `⌘/Ctrl + Shift + C` | Go to Clients |
| `⌘/Ctrl + Shift + P` | Go to Products |
| `⌘/Ctrl + Shift + R` | Go to Reports |
| `⌘/Ctrl + Shift + S` | Go to Settings |

### List Pages
| Shortcut | Action |
|----------|--------|
| `A` | Open Add dialog |
| `/` | Focus search input |
| `N` | New Invoice |

### Invoice Editor
| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + S` | Save draft |
| `⌘/Ctrl + Enter` | Finalize invoice |
| `⌘/Ctrl + P` | Toggle PDF preview |
| `⌘/Ctrl + I` | Add line item |

### Features
- **Platform detection** (Mac vs Windows)
- **Dynamic symbols** (⌘ vs Ctrl)
- **Visible badges** throughout UI
- **Keyboard hints** popup for new users

---

## AI Assistant

### AI Chatbot
- **Floating chat widget** (bottom-right corner)
- **Natural language queries**
- **Business context aware**
- **Powered by Lovable AI Gateway**

### Supported Models
- Google Gemini 2.5/3 (Flash, Pro)
- OpenAI GPT-5 family
- No API key required

### Features
- **Query business data**
- **Get help with features**
- **Usage tracking** per profile
- **Markdown response rendering**

---

## Admin Panel

### Admin Dashboard
- **User overview** (total users, active, suspended)
- **User management** table
- **Suspend/Unsuspend** users
- **Search users** by name/email

### User Detail View
- **Profile information**
- **Invoice statistics**
- **Suspend with reason**
- **View as user** (future)

### Announcements
- **Create system announcements**
- **Announcement types** (info, warning, success)
- **Expiry date** for time-limited messages
- **Active/Inactive** toggle

### Access Control
- **Role-based routing** (AdminRoute component)
- **Admin role check** via `has_role` function
- **Separate user_roles table**

---

## Performance Optimizations

### Code Splitting
- **Lazy-loaded routes** (all pages)
- **Lazy-loaded components** (heavy UI elements)
- **Dynamic imports** for large libraries (recharts)

### Caching
- **React Query caching** with staleTime
- **Profile fetch deduplication**
- **Memoized computations** (useMemo)
- **Memoized components** (React.memo)

### Network
- **Optimized Supabase queries**
- **Batch operations** where possible
- **Query invalidation** on mutations

### Bundle Size
- **Tree-shaking** enabled
- **Minimal dependencies**
- **CSS purging** via Tailwind

---

## Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| React Router | Navigation |
| TanStack Query | Data fetching |
| Zustand | State management |
| @dnd-kit | Drag and drop |
| @react-pdf/renderer | PDF generation |
| recharts | Charts |
| Lucide React | Icons |
| date-fns | Date utilities |
| zod | Schema validation |

### Backend (Lovable Cloud)
| Feature | Technology |
|---------|------------|
| Database | PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Edge Functions | Deno runtime |
| Email | Resend |
| AI | Lovable AI Gateway |

### Database Tables
- `profiles` - User business profiles
- `clients` - Customer records
- `products` - Inventory items
- `product_batches` - Batch tracking
- `invoices` - Invoice headers
- `invoice_items` - Invoice line items
- `quotations` - Quotation headers
- `quotation_items` - Quotation line items
- `delivery_challans` - Challan headers
- `challan_items` - Challan line items
- `purchase_orders` - PO headers
- `po_items` - PO line items
- `purchase_bills` - Supplier bills
- `purchase_bill_items` - Bill line items
- `recurring_templates` - Recurring invoice templates
- `recurring_template_items` - Template items
- `inventory_logs` - Stock audit trail
- `notifications` - User notifications
- `activity_logs` - Action audit trail
- `announcements` - System announcements
- `user_roles` - Admin/user roles
- `tds_entries` - TDS records
- `ai_usage_logs` - AI query tracking

---

## File Structure

```
src/
├── components/
│   ├── admin/          # Admin panel components
│   ├── auth/           # Auth guards (ProtectedRoute, AdminRoute)
│   ├── chat/           # AI chatbot
│   ├── dashboard/      # Dashboard widgets
│   ├── invoice/        # Invoice editor components
│   ├── layout/         # App shell (header, sidebar)
│   ├── onboarding/     # Tutorial components
│   ├── pdf/            # PDF document components
│   ├── reports/        # Report sub-components
│   ├── scanner/        # Barcode scanner
│   └── ui/             # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx # Authentication provider
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
│   └── translations/   # Language files
├── lib/                # Utilities
├── pages/              # Route components
├── stores/             # Zustand stores
├── types/              # TypeScript types
└── utils/              # Helper functions

supabase/
└── functions/
    ├── ai-assistant/      # AI chatbot backend
    └── send-invoice-email/# Email sending
```

---

## Summary

**Inw Invoices** is a comprehensive invoicing and inventory management solution featuring:

- ✅ Full invoicing lifecycle (Draft → Finalized → Paid)
- ✅ Quotations with invoice conversion
- ✅ Purchase orders and bills
- ✅ Delivery challans
- ✅ Recurring invoice automation
- ✅ Real-time inventory tracking with batches
- ✅ Complete GST compliance (GSTR-1, GSTR-3B)
- ✅ Professional PDF generation
- ✅ Email and WhatsApp sharing
- ✅ Multi-language support (EN/HI/BN)
- ✅ Full accessibility (WCAG compliant)
- ✅ Keyboard-first navigation
- ✅ AI-powered assistant
- ✅ Admin panel for user management
- ✅ Mobile-responsive design
- ✅ Dark/Light theme support
- ✅ Offline capability foundations

**Total Pages**: 29  
**Total Components**: 100+  
**Custom Hooks**: 27  
**Database Tables**: 21  
**Edge Functions**: 2

---

*Last updated: March 2026*
