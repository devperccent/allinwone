import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  pdfBase64: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    const { invoiceId, recipientEmail, pdfBase64 }: SendInvoiceRequest = await req.json();

    if (!invoiceId || !recipientEmail || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: invoiceId, recipientEmail, pdfBase64" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, client:clients(*)")
      .eq("id", invoiceId)
      .eq("profile_id", profile.id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format currency
    const formatINR = (amount: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);

    // Prepare email
    const clientName = invoice.client?.name || "Customer";
    const subject = `Invoice ${invoice.invoice_number} from ${profile.org_name}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${profile.org_name}</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Dear ${clientName},</p>
    
    <p>Please find attached invoice <strong>${invoice.invoice_number}</strong> for your reference.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Invoice Number</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Date</td>
          <td style="padding: 8px 0; text-align: right;">${invoice.date_issued}</td>
        </tr>
        ${invoice.date_due ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Due Date</td>
          <td style="padding: 8px 0; text-align: right;">${invoice.date_due}</td>
        </tr>
        ` : ""}
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; font-size: 16px;">Amount Due</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #4f46e5;">${formatINR(invoice.grand_total)}</td>
        </tr>
      </table>
    </div>
    
    ${profile.upi_vpa ? `
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      Pay via UPI: <strong>${profile.upi_vpa}</strong>
    </p>
    ` : ""}
    
    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>${profile.org_name}</strong><br>
      ${profile.email ? `<span style="color: #6b7280;">${profile.email}</span><br>` : ""}
      ${profile.phone ? `<span style="color: #6b7280;">${profile.phone}</span>` : ""}
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>This email was sent by ${profile.org_name} using Inw Invoices</p>
  </div>
</body>
</html>
    `;

    // Convert base64 to buffer
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));

    // Send email with Resend
    const emailResponse = await resend.emails.send({
      from: `${profile.org_name} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
