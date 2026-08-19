import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Confirmation token is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. FIND ORDER BY TOKEN
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("confirmation_token", token)
      .single();

    if (findError || !order) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired confirmation link." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. CHECK ALREADY CONFIRMED
    if (order.status !== "pending_confirmation") {
      return new Response(
        JSON.stringify({ error: "This order has already been confirmed or cancelled." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. CHECK TOKEN EXPIRY
    const now = new Date();
    const expiresAt = new Date(order.confirmation_token_expires_at);
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: "This confirmation link has expired. Please contact us." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. ATOMIC CONFIRMATION — only succeeds if status is still pending_confirmation
    // The WHERE clause on status prevents race conditions / double-confirmation
    const confirmedAt = new Date().toISOString();
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        confirmed_at: confirmedAt,
        confirmation_token: null,           // Invalidate token immediately
        confirmation_token_expires_at: null,
      })
      .eq("id", order.id)
      .eq("status", "pending_confirmation") // Atomic guard against double-confirmation
      .eq("confirmation_token", token)       // Must match exact token
      .select()
      .single();

    if (updateError || !updatedOrder) {
      return new Response(
        JSON.stringify({ error: "Could not confirm order. It may have already been confirmed." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. FETCH ORDER ITEMS FOR OWNER EMAIL
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const item = orderItems?.[0];
    const shortOrderId = order.id.split("-")[0].toUpperCase();

    // 6. SEND OWNER NOTIFICATION EMAIL
    const ownerEmailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;}
.wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.header{background:#065F46;padding:32px 40px;text-align:center;}
.header h1{color:#fff;margin:0;font-size:22px;}
.header p{color:#a7f3d0;margin:8px 0 0;font-size:14px;}
.body{padding:40px;}
.confirmed-badge{background:#d1fae5;border:1px solid #34d399;border-radius:8px;padding:16px;text-align:center;color:#065f46;font-weight:700;font-size:16px;margin-bottom:24px;}
.section-title{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin:24px 0 12px;}
.order-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin-bottom:16px;}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;}
.row:last-child{border-bottom:none;font-weight:700;}
.label{color:#64748b;}.value{color:#0f172a;font-weight:500;}
.footer{background:#f8fafc;padding:24px;text-align:center;font-size:12px;color:#94a3b8;}
</style></head><body>
<div class="wrapper">
  <div class="header"><h1>APlusOptics Admin</h1><p>Confirmed Order Notification</p></div>
  <div class="body">
    <div class="confirmed-badge">Customer has confirmed this order.</div>

    <div class="section-title">Customer Details</div>
    <div class="order-box">
      <div class="row"><span class="label">Name</span><span class="value">${order.customer_name}</span></div>
      <div class="row"><span class="label">Email</span><span class="value">${order.customer_email}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${order.customer_phone}</span></div>
      <div class="row"><span class="label">Address</span><span class="value">${order.address}</span></div>
      <div class="row"><span class="label">City</span><span class="value">${order.city}</span></div>
      ${order.notes ? `<div class="row"><span class="label">Notes</span><span class="value">${order.notes}</span></div>` : ""}
    </div>

    <div class="section-title">Order Details</div>
    <div class="order-box">
      <div class="row"><span class="label">Order ID</span><span class="value">#${shortOrderId}</span></div>
      ${item ? `
      <div class="row"><span class="label">Product</span><span class="value">${item.product_name_snapshot}</span></div>
      <div class="row"><span class="label">SKU</span><span class="value">${item.product_sku_snapshot || "N/A"}</span></div>
      <div class="row"><span class="label">Category</span><span class="value">${item.product_category_snapshot || "N/A"}</span></div>
      <div class="row"><span class="label">Quantity</span><span class="value">${item.quantity}</span></div>
      <div class="row"><span class="label">Unit Price</span><span class="value">Rs. ${parseFloat(item.unit_price_snapshot).toLocaleString()}</span></div>
      ` : ""}
      <div class="row"><span class="label">Total</span><span class="value">Rs. ${parseFloat(order.total).toLocaleString()}</span></div>
      <div class="row"><span class="label">Order Date</span><span class="value">${new Date(order.created_at).toLocaleString()}</span></div>
      <div class="row"><span class="label">Confirmed At</span><span class="value">${new Date(confirmedAt).toLocaleString()}</span></div>
    </div>
  </div>
  <div class="footer">&copy; 2026 APlusOptics</div>
</div></body></html>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "APlusOptics Orders <orders@aplusoptics.com>",
        to: ["opticsaplus@gmail.com"],
        subject: `Confirmed Optics Order — #${shortOrderId}`,
        html: ownerEmailHtml,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Order confirmed successfully." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
