import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-user-authorization",
};

const SYSTEM_PROMPT = `You are a powerful business assistant for "InWone", an Indian invoicing & inventory platform. You have FULL access to the user's data and can perform any action they ask.

You can:
- **Read data**: List/search invoices, clients, products, quotations, challans, purchase orders
- **Create**: Add new clients, products
- **Update**: Edit clients, products, mark invoices as paid/cancelled, adjust stock
- **Delete**: Remove clients, products
- **Navigate**: Direct users to specific pages in the app
- **Analyze**: Provide business insights from their data

IMPORTANT RULES:
1. Always use the available tools to fetch real data - never make up numbers or records.
2. When users ask to "create an invoice", use navigate_to with path "/invoices/new" since invoice creation requires the full editor.
3. For quotations, challans, POs - navigate to their respective editors too.
4. Be concise and use Indian business terminology (GSTIN, HSN, challan, udhaar).
5. Format currency as ₹ with Indian number formatting.
6. When listing records, show the most relevant info in a clean markdown table.
7. If a tool call fails, explain the error clearly and suggest a fix.
8. For stock adjustments, always log the reason.`;

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
              "/purchase-orders", "/purchase-orders/new", "/recurring-invoices",
              "/reports", "/settings", "/quick-bill",
            ],
          },
        },
        required: ["path"],
      },
    },
  },
];

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

      case "navigate_to": {
        return JSON.stringify({ action: "navigate", path: args.path });
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

    // Get user auth from the custom header (user's JWT)
    const userAuth = req.headers.get("x-user-authorization") || req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create user-scoped Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: userAuth || "" } },
    });

    // Get user's profile ID
    const { data: profileData, error: profileError } = await supabase.rpc("get_user_profile_id");
    if (profileError || !profileData) {
      return new Response(
        JSON.stringify({ error: "Unable to identify user. Please log in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const profileId = profileData as string;

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
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools: TOOLS,
          stream: round === MAX_TOOL_ROUNDS, // only stream the final round
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const t = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, t);
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // If this is the final round, stream it
      if (round === MAX_TOOL_ROUNDS) {
        return new Response(aiResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
            model: "google/gemini-3-flash-preview",
            messages: aiMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          // Fallback: return non-streamed content
          const content = choice.message?.content || "I couldn't process that request.";
          const lines = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;
          return new Response(lines, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }

        return new Response(streamResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
