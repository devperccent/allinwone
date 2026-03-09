import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// API Version - increment for breaking changes
const API_VERSION = "1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-user-authorization, x-api-version",
  "X-API-Version": API_VERSION,
};

// Rate limiting configuration
const RATE_LIMITS = {
  standard: { daily_queries: 50, premium_model_queries: 10 },
  premium: { daily_queries: 200, premium_model_queries: 100 },
  admin: { daily_queries: 1000, premium_model_queries: 500 },
};

// Model tiers - fallback to cheaper model after quota
const MODELS = {
  premium: "google/gemini-2.5-pro",
  standard: "google/gemini-2.5-flash",
  budget: "google/gemini-2.5-flash-lite",
};

const SYSTEM_PROMPT = `You are an expert business assistant for "InWone", a comprehensive Indian invoicing, inventory, and accounting platform. You have FULL real-time access to the user's business data and can perform actions on their behalf.

## YOUR CAPABILITIES

### Data Access (Always fetch real data - NEVER make up numbers)
- **Invoices**: List, search, view details, mark as paid/cancelled
- **Clients/Parties**: Full CRUD (Create, Read, Update, Delete)
- **Products/Inventory**: Full CRUD, stock adjustments, low stock alerts
- **Quotations**: List and view
- **Navigation**: Direct users to any page in the app

### Actions You Can Perform
- Create new clients with complete details (name, GSTIN, address, state code)
- Create new products with pricing, HSN codes, stock levels
- Update client/product information
- Mark invoices as paid (with payment mode) or cancelled
- Adjust stock quantities with automatic inventory logging
- Navigate users to create invoices, quotations, challans, POs

## CRITICAL RULES

1. **Data Accuracy**: ALWAYS use tools to fetch real data. Never guess or fabricate numbers.
2. **Invoice Creation**: When users want to create invoices, navigate to "/invoices/new" - the full editor is required.
3. **Quotations/Challans/POs**: Navigate to respective "/new" routes for creation.
4. **Currency Format**: Always use ₹ symbol with Indian number formatting (lakhs, crores if applicable).
5. **Business Terminology**: Use Indian terms - GSTIN, HSN, challan, udhaar (credit), etc.
6. **Tables**: Present lists in clean markdown tables with the most relevant columns.
7. **Errors**: If a tool fails, explain clearly and suggest solutions.
8. **Stock Changes**: Log all inventory adjustments with reason "ai_adjustment".
9. **Confirmations**: For destructive actions (delete), confirm before proceeding unless explicitly instructed.

## RESPONSE STYLE

- Be concise but thorough
- Lead with the answer, then details
- Use bullet points for multiple items
- Highlight important numbers in **bold**
- For navigation, confirm where you're taking them

## COMMON WORKFLOWS

**"Show unpaid invoices"** → Use list_invoices with status="finalized"
**"Low stock items"** → Use list_products with low_stock_only=true
**"Add client X"** → Use create_client with provided details
**"Create invoice"** → Navigate to /invoices/new
**"Mark invoice X as paid"** → Use update_invoice_status with status="paid"
**"Dashboard stats"** → Use get_dashboard_stats for overview

Remember: You represent a professional business tool. Be accurate, efficient, and helpful.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_invoices",
      description: "List invoices with optional filters. Returns recent invoices by default.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["draft", "finalized", "paid", "cancelled"], description: "Filter by status" },
          limit: { type: "number", description: "Max results (default 10)" },
          search: { type: "string", description: "Search by invoice number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_invoice_details",
      description: "Get full details of a specific invoice including line items and client info.",
      parameters: {
        type: "object",
        properties: { invoice_id: { type: "string", description: "Invoice UUID" } },
        required: ["invoice_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "List all clients or search by name/email.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search by name, email, or GSTIN" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client",
      description: "Create a new client.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          gstin: { type: "string" },
          billing_address: { type: "string" },
          state_code: { type: "string", description: "2-digit state code, default 27" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Update an existing client's details.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          gstin: { type: "string" },
          billing_address: { type: "string" },
          state_code: { type: "string" },
        },
        required: ["client_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_client",
      description: "Delete a client by ID.",
      parameters: {
        type: "object",
        properties: { client_id: { type: "string" } },
        required: ["client_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_products",
      description: "List products/inventory with optional search.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search by name or SKU" },
          low_stock_only: { type: "boolean", description: "Only show low stock items" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_product",
      description: "Create a new product.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          sku: { type: "string" },
          selling_price: { type: "number" },
          stock_quantity: { type: "number" },
          tax_rate: { type: "number", description: "GST rate %, default 18" },
          hsn_code: { type: "string" },
          type: { type: "string", enum: ["goods", "service"] },
          low_stock_limit: { type: "number" },
          description: { type: "string" },
        },
        required: ["name", "sku"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_product",
      description: "Update product details or adjust stock.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          name: { type: "string" },
          selling_price: { type: "number" },
          stock_quantity: { type: "number" },
          tax_rate: { type: "number" },
          hsn_code: { type: "string" },
          low_stock_limit: { type: "number" },
          description: { type: "string" },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_product",
      description: "Delete a product by ID.",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_invoice_status",
      description: "Update an invoice's status (e.g. mark as paid, cancelled).",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string" },
          status: { type: "string", enum: ["paid", "cancelled"] },
          payment_mode: { type: "string", description: "Payment method if marking paid" },
        },
        required: ["invoice_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get business overview stats: total invoices, revenue, unpaid amount, client count, low stock items.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_quotations",
      description: "List quotations with optional status filter.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["draft", "sent", "accepted", "rejected", "converted"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_purchase_orders",
      description: "List purchase orders with optional status filter.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["draft", "sent", "received", "cancelled"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_purchase_bills",
      description: "List purchase bills with optional status filter.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["draft", "received"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to",
      description: "Navigate the user to a specific page in the app. Use this when user wants to create invoices, quotations, challans, etc.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "App route path",
            enum: [
              "/dashboard", "/invoices", "/invoices/new", "/clients", "/products",
              "/quotations", "/quotations/new", "/challans", "/challans/new",
              "/purchase-orders", "/purchase-orders/new", "/purchase-bills", "/purchase-bills/new",
              "/recurring", "/reports", "/settings", "/quick-bill", "/billing",
            ],
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_quick_invoice",
      description: "Create a draft invoice with client and items. Use this when user provides client name and item details directly. Returns the created invoice ID for navigation.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Client name - will create new if doesn't exist" },
          client_phone: { type: "string", description: "Client phone (optional)" },
          client_email: { type: "string", description: "Client email (optional)" },
          items: {
            type: "array",
            description: "Invoice line items",
            items: {
              type: "object",
              properties: {
                description: { type: "string", description: "Item description" },
                qty: { type: "number", description: "Quantity" },
                rate: { type: "number", description: "Rate per unit" },
                tax_rate: { type: "number", description: "GST rate %, default 18" },
              },
              required: ["description", "qty", "rate"],
            },
          },
          notes: { type: "string", description: "Invoice notes (optional)" },
        },
        required: ["client_name", "items"],
      },
    },
  },
];

// Rate limiting and model selection logic
async function checkRateLimitAndSelectModel(
  supabase: any,
  profileId: string,
  isAdmin: boolean
): Promise<{ allowed: boolean; model: string; reason?: string; queriesRemaining?: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Get user's tier and query count
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("ai_queries_today, ai_last_query_date, ai_tier")
    .eq("id", profileId)
    .single();

  if (profileError) {
    console.error("Error fetching profile for rate limit:", profileError);
    return { allowed: true, model: MODELS.standard }; // Fail open with standard model
  }

  const tier = isAdmin ? "admin" : (profile.ai_tier || "standard");
  const limits = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.standard;
  
  const today = new Date().toISOString().split("T")[0];
  const lastQueryDate = profile.ai_last_query_date;
  let queriesUsedToday = profile.ai_queries_today || 0;

  // Reset counter if it's a new day
  if (lastQueryDate !== today) {
    queriesUsedToday = 0;
  }

  // Check if user has exceeded daily limit
  if (queriesUsedToday >= limits.daily_queries) {
    return {
      allowed: false,
      model: MODELS.budget,
      reason: `You've reached your daily AI query limit (${limits.daily_queries}). Please try again tomorrow or upgrade your plan.`,
      queriesRemaining: 0,
    };
  }

  // Select model based on usage
  let model: string;
  if (queriesUsedToday < limits.premium_model_queries) {
    model = MODELS.premium;
  } else if (queriesUsedToday < limits.daily_queries * 0.8) {
    model = MODELS.standard;
  } else {
    model = MODELS.budget;
  }

  // Update query count
  await adminClient
    .from("profiles")
    .update({
      ai_queries_today: queriesUsedToday + 1,
      ai_last_query_date: today,
    })
    .eq("id", profileId);

  // Log usage
  await adminClient.from("ai_usage_logs").insert({
    profile_id: profileId,
    model_used: model,
    period_start: new Date(today).toISOString(),
  });

  return {
    allowed: true,
    model,
    queriesRemaining: limits.daily_queries - queriesUsedToday - 1,
  };
}

// Check if user is admin
async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

// Tool execution
async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabase: any,
  profileId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "list_invoices": {
        let query = supabase
          .from("invoices")
          .select("id, invoice_number, status, grand_total, date_issued, date_due, clients(name)")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        if (args.search) query = query.ilike("invoice_number", `%${args.search}%`);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ invoices: data, count: data.length });
      }

      case "get_invoice_details": {
        const { data: inv, error: invErr } = await supabase
          .from("invoices")
          .select("*, clients(name, email, gstin, phone)")
          .eq("id", args.invoice_id)
          .eq("profile_id", profileId)
          .single();
        if (invErr) throw invErr;
        const { data: items } = await supabase
          .from("invoice_items")
          .select("*, products(name)")
          .eq("invoice_id", args.invoice_id)
          .order("sort_order");
        return JSON.stringify({ invoice: inv, items });
      }

      case "list_clients": {
        let query = supabase
          .from("clients")
          .select("id, name, email, phone, gstin, credit_balance")
          .eq("profile_id", profileId)
          .order("name")
          .limit(args.limit || 20);
        if (args.search) {
          query = query.or(`name.ilike.%${args.search}%,email.ilike.%${args.search}%,gstin.ilike.%${args.search}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ clients: data, count: data.length });
      }

      case "create_client": {
        const { data, error } = await supabase
          .from("clients")
          .insert({
            profile_id: profileId,
            name: args.name,
            email: args.email || null,
            phone: args.phone || null,
            gstin: args.gstin || null,
            billing_address: args.billing_address || null,
            state_code: args.state_code || "27",
          })
          .select()
          .single();
        if (error) throw error;
        return JSON.stringify({ success: true, client: data });
      }

      case "update_client": {
        const { client_id, ...updates } = args;
        const cleanUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) cleanUpdates[k] = v;
        }
        const { data, error } = await supabase
          .from("clients")
          .update(cleanUpdates)
          .eq("id", client_id)
          .eq("profile_id", profileId)
          .select()
          .single();
        if (error) throw error;
        return JSON.stringify({ success: true, client: data });
      }

      case "delete_client": {
        const { error } = await supabase
          .from("clients")
          .delete()
          .eq("id", args.client_id)
          .eq("profile_id", profileId);
        if (error) throw error;
        return JSON.stringify({ success: true });
      }

      case "list_products": {
        let query = supabase
          .from("products")
          .select("id, name, sku, selling_price, stock_quantity, low_stock_limit, tax_rate, type, hsn_code")
          .eq("profile_id", profileId)
          .order("name")
          .limit(args.limit || 20);
        if (args.search) {
          query = query.or(`name.ilike.%${args.search}%,sku.ilike.%${args.search}%`);
        }
        if (args.low_stock_only) {
          query = query.filter("stock_quantity", "lte", "low_stock_limit");
        }
        const { data, error } = await query;
        if (error) throw error;
        // For low_stock_only, filter in JS since we can't compare columns easily
        let results = data;
        if (args.low_stock_only) {
          results = data.filter((p: any) => p.stock_quantity <= p.low_stock_limit);
        }
        return JSON.stringify({ products: results, count: results.length });
      }

      case "create_product": {
        const { data, error } = await supabase
          .from("products")
          .insert({
            profile_id: profileId,
            name: args.name,
            sku: args.sku,
            selling_price: args.selling_price || 0,
            stock_quantity: args.stock_quantity || 0,
            tax_rate: args.tax_rate ?? 18,
            hsn_code: args.hsn_code || null,
            type: args.type || "goods",
            low_stock_limit: args.low_stock_limit ?? 10,
            description: args.description || null,
          })
          .select()
          .single();
        if (error) throw error;
        return JSON.stringify({ success: true, product: data });
      }

      case "update_product": {
        const { product_id, ...updates } = args;
        // If stock changed, we need old value for logging
        let oldStock: number | null = null;
        if (updates.stock_quantity !== undefined) {
          const { data: old } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", product_id)
            .single();
          oldStock = old?.stock_quantity ?? null;
        }
        const cleanUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) cleanUpdates[k] = v;
        }
        const { data, error } = await supabase
          .from("products")
          .update(cleanUpdates)
          .eq("id", product_id)
          .eq("profile_id", profileId)
          .select()
          .single();
        if (error) throw error;
        // Log inventory change
        if (oldStock !== null && updates.stock_quantity !== undefined) {
          const change = updates.stock_quantity - oldStock;
          if (change !== 0) {
            await supabase.from("inventory_logs").insert({
              product_id,
              change_amount: change,
              reason: "ai_adjustment",
            });
          }
        }
        return JSON.stringify({ success: true, product: data });
      }

      case "delete_product": {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", args.product_id)
          .eq("profile_id", profileId);
        if (error) throw error;
        return JSON.stringify({ success: true });
      }

      case "update_invoice_status": {
        const updateData: Record<string, any> = { status: args.status };
        if (args.status === "paid") {
          updateData.payment_date = new Date().toISOString().split("T")[0];
          if (args.payment_mode) updateData.payment_mode = args.payment_mode;
        }
        const { data, error } = await supabase
          .from("invoices")
          .update(updateData)
          .eq("id", args.invoice_id)
          .eq("profile_id", profileId)
          .select("id, invoice_number, status")
          .single();
        if (error) throw error;
        return JSON.stringify({ success: true, invoice: data });
      }

      case "get_dashboard_stats": {
        const [invoicesRes, clientsRes, productsRes] = await Promise.all([
          supabase.from("invoices").select("status, grand_total").eq("profile_id", profileId),
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("profile_id", profileId),
          supabase.from("products").select("id, stock_quantity, low_stock_limit, type").eq("profile_id", profileId),
        ]);
        const invoices = invoicesRes.data || [];
        const totalRevenue = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.grand_total), 0);
        const unpaidAmount = invoices.filter((i: any) => i.status === "finalized").reduce((s: number, i: any) => s + Number(i.grand_total), 0);
        const lowStockItems = (productsRes.data || []).filter((p: any) => p.type === "goods" && p.stock_quantity <= p.low_stock_limit);
        return JSON.stringify({
          total_invoices: invoices.length,
          draft: invoices.filter((i: any) => i.status === "draft").length,
          finalized: invoices.filter((i: any) => i.status === "finalized").length,
          paid: invoices.filter((i: any) => i.status === "paid").length,
          total_revenue: totalRevenue,
          unpaid_amount: unpaidAmount,
          total_clients: clientsRes.count || 0,
          total_products: (productsRes.data || []).length,
          low_stock_items: lowStockItems.length,
        });
      }

      case "list_quotations": {
        let query = supabase
          .from("quotations")
          .select("id, quotation_number, status, grand_total, date_issued, valid_until, clients(name)")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ quotations: data, count: data.length });
      }

      case "list_purchase_orders": {
        let query = supabase
          .from("purchase_orders")
          .select("id, po_number, status, grand_total, date_issued, supplier_name")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ purchase_orders: data, count: data.length });
      }

      case "list_purchase_bills": {
        let query = supabase
          .from("purchase_bills")
          .select("id, bill_number, status, grand_total, bill_date, supplier_name")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ purchase_bills: data, count: data.length });
      }

      case "navigate_to": {
        return JSON.stringify({ action: "navigate", path: args.path });
      }

      case "create_quick_invoice": {
        // First, find or create client
        let clientId: string | null = null;
        
        // Try to find existing client by name
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("profile_id", profileId)
          .ilike("name", args.client_name)
          .limit(1)
          .single();
        
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientErr } = await supabase
            .from("clients")
            .insert({
              profile_id: profileId,
              name: args.client_name,
              phone: args.client_phone || null,
              email: args.client_email || null,
              state_code: "27",
            })
            .select("id")
            .single();
          
          if (clientErr) throw new Error(`Failed to create client: ${clientErr.message}`);
          clientId = newClient.id;
        }

        // Generate invoice number
        const { data: invNumber, error: numErr } = await supabase.rpc("generate_invoice_number", { p_profile_id: profileId });
        if (numErr) throw new Error(`Failed to generate invoice number: ${numErr.message}`);

        // Calculate totals
        const items = args.items || [];
        let subtotal = 0;
        let totalTax = 0;

        for (const item of items) {
          const taxRate = item.tax_rate ?? 18;
          const lineAmount = item.qty * item.rate;
          const lineTax = lineAmount * (taxRate / 100);
          subtotal += lineAmount;
          totalTax += lineTax;
        }

        const grandTotal = subtotal + totalTax;

        // Create invoice
        const { data: invoice, error: invErr } = await supabase
          .from("invoices")
          .insert({
            profile_id: profileId,
            client_id: clientId,
            invoice_number: invNumber,
            status: "draft",
            subtotal,
            total_tax: totalTax,
            grand_total: grandTotal,
            notes: args.notes || null,
          })
          .select("id, invoice_number")
          .single();

        if (invErr) throw new Error(`Failed to create invoice: ${invErr.message}`);

        // Insert line items
        const lineItems = items.map((item: any, idx: number) => {
          const taxRate = item.tax_rate ?? 18;
          const lineAmount = item.qty * item.rate;
          const lineTax = lineAmount * (taxRate / 100);
          return {
            invoice_id: invoice.id,
            description: item.description,
            qty: item.qty,
            rate: item.rate,
            tax_rate: taxRate,
            amount: lineAmount + lineTax,
            sort_order: idx,
          };
        });

        if (lineItems.length > 0) {
          const { error: itemsErr } = await supabase.from("invoice_items").insert(lineItems);
          if (itemsErr) console.error("Failed to insert invoice items:", itemsErr);
        }

        return JSON.stringify({
          success: true,
          invoice: invoice,
          client_created: !existingClient,
          action: "navigate",
          path: `/invoices/${invoice.id}`,
          message: `Created draft invoice ${invoice.invoice_number} with ${items.length} item(s). Total: ₹${grandTotal.toLocaleString("en-IN")}`,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err: any) {
    console.error(`Tool ${toolName} error:`, err);
    return JSON.stringify({ error: err.message || "Tool execution failed" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check API version header (for future compatibility)
    const clientVersion = req.headers.get("x-api-version");
    if (clientVersion && clientVersion !== API_VERSION) {
      console.log(`Client using API version ${clientVersion}, server is ${API_VERSION}`);
    }

    // Get user auth from the custom header (user's JWT)
    const userAuth = req.headers.get("x-user-authorization") || req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create user-scoped Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: userAuth || "" } },
    });

    // Get user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unable to identify user. Please log in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile ID
    const { data: profileData, error: profileError } = await supabase.rpc("get_user_profile_id");
    if (profileError || !profileData) {
      return new Response(
        JSON.stringify({ error: "Unable to identify user profile. Please log in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const profileId = profileData as string;

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);

    // Rate limiting and model selection
    const rateCheck = await checkRateLimitAndSelectModel(supabase, profileId, isAdmin);
    
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: rateCheck.reason,
          rate_limited: true,
          queries_remaining: 0,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectedModel = rateCheck.model;
    console.log(`Using model: ${selectedModel} for user ${profileId}, queries remaining: ${rateCheck.queriesRemaining}`);

    // AI conversation loop with tool calling
    let aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    const MAX_TOOL_ROUNDS = 5;
    let round = 0;

    while (round < MAX_TOOL_ROUNDS) {
      round++;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: aiMessages,
          tools: TOOLS,
          stream: round === MAX_TOOL_ROUNDS, // only stream the final round
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ 
            error: "AI service is busy. Please try again in a moment.",
            rate_limited: true,
          }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ 
            error: "AI credits exhausted. Please contact support.",
            credits_exhausted: true,
          }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const t = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, t);
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // If this is the final round, stream it
      if (round === MAX_TOOL_ROUNDS) {
        return new Response(aiResponse.body, {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "text/event-stream",
            "X-Model-Used": selectedModel,
            "X-Queries-Remaining": String(rateCheck.queriesRemaining ?? 0),
          },
        });
      }

      const result = await aiResponse.json();
      const choice = result.choices?.[0];

      if (!choice) {
        return new Response(JSON.stringify({ error: "No response from AI" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // If no tool calls, stream the final response
      if (!choice.message?.tool_calls || choice.message.tool_calls.length === 0) {
        // Re-request with streaming for final text response
        const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: aiMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          // Fallback: return non-streamed content
          const content = choice.message?.content || "I couldn't process that request.";
          const lines = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;
          return new Response(lines, {
            headers: { 
              ...corsHeaders, 
              "Content-Type": "text/event-stream",
              "X-Model-Used": selectedModel,
              "X-Queries-Remaining": String(rateCheck.queriesRemaining ?? 0),
            },
          });
        }

        return new Response(streamResponse.body, {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "text/event-stream",
            "X-Model-Used": selectedModel,
            "X-Queries-Remaining": String(rateCheck.queriesRemaining ?? 0),
          },
        });
      }

      // Execute tool calls
      aiMessages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, any> = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || "{}");
        } catch { /* empty args */ }

        const toolResult = await executeTool(fnName, fnArgs, supabase, profileId);

        aiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        } as any);
      }
    }

    return new Response(JSON.stringify({ error: "Too many tool rounds" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
