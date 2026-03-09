import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type DigestType = "daily" | "weekly" | "monthly";

interface DigestSummary {
  period: string;
  invoicesCreated: number;
  invoicesFinalized: number;
  totalRevenue: number;
  paymentsReceived: number;
  paymentTotal: number;
  expensesTotal: number;
  overdueInvoices: number;
  overdueAmount: number;
  topClients: { name: string; amount: number }[];
}

function getDateRange(type: DigestType): { start: string; end: string; label: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];

  if (type === "daily") {
    // Yesterday's summary
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    return { start: start.toISOString().split("T")[0], end, label: "Daily" };
  } else if (type === "weekly") {
    // Last 7 days
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start: start.toISOString().split("T")[0], end, label: "Weekly" };
  } else {
    // Last 30 days
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start: start.toISOString().split("T")[0], end, label: "Monthly" };
  }
}

async function buildDigest(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  type: DigestType
): Promise<DigestSummary> {
  const { start, end, label } = getDateRange(type);

  // Invoices created in period
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, status, grand_total, client_id, date_due")
    .eq("profile_id", profileId)
    .gte("date_issued", start)
    .lte("date_issued", end);

  const invoiceList = invoices || [];
  const invoicesCreated = invoiceList.length;
  const invoicesFinalized = invoiceList.filter((i: any) => i.status === "finalized" || i.status === "paid").length;
  const totalRevenue = invoiceList.reduce((sum: number, i: any) => sum + Number(i.grand_total || 0), 0);

  // Overdue invoices (all time, still unpaid)
  const today = new Date().toISOString().split("T")[0];
  const { data: overdue } = await supabase
    .from("invoices")
    .select("grand_total")
    .eq("profile_id", profileId)
    .in("status", ["draft", "finalized"])
    .lt("date_due", today)
    .not("date_due", "is", null);

  const overdueList = overdue || [];
  const overdueInvoices = overdueList.length;
  const overdueAmount = overdueList.reduce((sum: number, i: any) => sum + Number(i.grand_total || 0), 0);

  // Payments received in period
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("profile_id", profileId)
    .gte("payment_date", start)
    .lte("payment_date", end);

  const paymentList = payments || [];
  const paymentsReceived = paymentList.length;
  const paymentTotal = paymentList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  // Expenses in period
  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("profile_id", profileId)
    .gte("expense_date", start)
    .lte("expense_date", end);

  const expensesTotal = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

  // Top clients by revenue in period
  const clientRevenue: Record<string, number> = {};
  const clientIds = [...new Set(invoiceList.filter((i: any) => i.client_id).map((i: any) => i.client_id))];

  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .in("id", clientIds);

    const clientMap = new Map((clients || []).map((c: any) => [c.id, c.name]));

    for (const inv of invoiceList) {
      if (inv.client_id) {
        const name = clientMap.get(inv.client_id) || "Unknown";
        clientRevenue[name] = (clientRevenue[name] || 0) + Number(inv.grand_total || 0);
      }
    }
  }

  const topClients = Object.entries(clientRevenue)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    period: label,
    invoicesCreated,
    invoicesFinalized,
    totalRevenue,
    paymentsReceived,
    paymentTotal,
    expensesTotal,
    overdueInvoices,
    overdueAmount,
    topClients,
  };
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function buildEmailHtml(summary: DigestSummary, orgName: string): string {
  const topClientsHtml = summary.topClients.length > 0
    ? summary.topClients.map(c => `<tr><td style="padding:6px 0;color:#374151;">${c.name}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${formatINR(c.amount)}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:6px 0;color:#9ca3af;">No client activity this period</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:24px 30px;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;font-size:20px;">${orgName}</h1>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px;">${summary.period} Business Summary</p>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;">
    <div style="display:grid;gap:12px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px;background:#f0fdf4;border-radius:8px;text-align:center;width:50%;">
            <div style="font-size:22px;font-weight:700;color:#16a34a;">${formatINR(summary.paymentTotal)}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Collected (${summary.paymentsReceived} payments)</div>
          </td>
          <td style="padding:10px;background:#fef2f2;border-radius:8px;text-align:center;width:50%;">
            <div style="font-size:22px;font-weight:700;color:#dc2626;">${formatINR(summary.overdueAmount)}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Overdue (${summary.overdueInvoices} invoices)</div>
          </td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Invoices Created</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${summary.invoicesCreated}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Invoices Finalized</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${summary.invoicesFinalized}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Total Revenue</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${formatINR(summary.totalRevenue)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Expenses</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#dc2626;">-${formatINR(summary.expensesTotal)}</td>
        </tr>
        <tr style="border-top:2px solid #e5e7eb;">
          <td style="padding:12px 0;font-weight:700;">Net Income</td>
          <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px;color:#4f46e5;">${formatINR(summary.paymentTotal - summary.expensesTotal)}</td>
        </tr>
      </table>
    </div>
    ${summary.topClients.length > 0 ? `
    <div style="margin-top:20px;">
      <h3 style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;">Top Clients</h3>
      <table style="width:100%;border-collapse:collapse;">${topClientsHtml}</table>
    </div>` : ""}
  </div>
  <div style="text-align:center;padding:16px;color:#9ca3af;font-size:11px;">
    <p>You received this because you enabled ${summary.period.toLowerCase()} digests in your settings.</p>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type } = (await req.json()) as { type: DigestType };

    if (!["daily", "weekly", "monthly"].includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid digest type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all users who opted into this digest type
    const digestColumn = `${type}_digest`;
    const { data: prefs, error: prefsError } = await supabase
      .from("email_digest_preferences")
      .select("profile_id, digest_email")
      .eq(digestColumn, true);

    if (prefsError) {
      throw new Error(`Failed to fetch digest prefs: ${prefsError.message}`);
    }

    const results: { profileId: string; status: string }[] = [];

    for (const pref of prefs || []) {
      try {
        // Get profile info
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, org_name, email")
          .eq("id", pref.profile_id)
          .single();

        if (!profile) continue;

        const recipientEmail = pref.digest_email || profile.email;
        if (!recipientEmail) {
          results.push({ profileId: pref.profile_id, status: "no_email" });
          continue;
        }

        // Build summary
        const summary = await buildDigest(supabase, pref.profile_id, type);

        // Build email HTML
        const emailHtml = buildEmailHtml(summary, profile.org_name);

        // TODO: Send email via Resend when RESEND_API_KEY is configured
        // const resendApiKey = Deno.env.get("RESEND_API_KEY");
        // if (resendApiKey) {
        //   const resend = new Resend(resendApiKey);
        //   await resend.emails.send({
        //     from: `${profile.org_name} <onboarding@resend.dev>`,
        //     to: [recipientEmail],
        //     subject: `${summary.period} Business Summary - ${profile.org_name}`,
        //     html: emailHtml,
        //   });
        // }

        console.log(`[Digest] ${type} digest prepared for ${recipientEmail} (${profile.org_name})`);
        results.push({ profileId: pref.profile_id, status: "prepared" });
      } catch (err: any) {
        console.error(`[Digest] Error for profile ${pref.profile_id}:`, err.message);
        results.push({ profileId: pref.profile_id, status: `error: ${err.message}` });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Digest] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
