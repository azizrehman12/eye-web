import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceRoleKey(): string {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = getServiceRoleKey();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server Configuration Error: service role key is missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    if (order.status === "confirmed") {
      return new Response(
        JSON.stringify({
          success: true,
          already_confirmed: true,
          message: "This order has already been confirmed.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status !== "pending_confirmation") {
      return new Response(
        JSON.stringify({ error: "This order has already been confirmed or cancelled." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. CHECK TOKEN EXPIRY
    if (order.confirmation_token_expires_at) {
      const now = new Date();
      const expiresAt = new Date(order.confirmation_token_expires_at);
      if (now > expiresAt) {
        return new Response(
          JSON.stringify({ error: "This confirmation link has expired. Please contact us." }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const confirmedAt = new Date().toISOString();

    // 4. ATOMIC CONFIRMATION — only succeeds if status is still pending_confirmation
    const { data: updatedOrders, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        confirmed_at: confirmedAt,
      })
      .eq("id", order.id)
      .eq("status", "pending_confirmation")
      .select();

    if (updateError) {
      console.error("Update error:", updateError);

      if (updateError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: true,
            already_confirmed: true,
            message: "This order has already been confirmed.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Database error during confirmation. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          already_confirmed: true,
          message: "This order has already been confirmed.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. FETCH ORDER ITEMS FOR OWNER EMAIL
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const shortOrderId = order.id.split("-")[0].toUpperCase();
    const siteUrl = Deno.env.get("SITE_URL") || "https://aplusoptics.com";
    const deliveryCharges = 300;
    const subtotal = parseFloat(order.subtotal ?? (parseFloat(order.total) - deliveryCharges));

    const productIds = (orderItems || []).map((item) => item.product_id).filter(Boolean);
    const { data: productsData } = productIds.length
      ? await supabase.from("products").select("id, slug").in("id", productIds)
      : { data: [] };

    const slugByProductId = new Map((productsData || []).map((p) => [p.id, p.slug]));

    let itemsHtml = "";
    (orderItems || []).forEach((item) => {
      const slug = slugByProductId.get(item.product_id);
      const productLink = slug ? `${siteUrl}/products/${slug}` : "Product link unavailable";

      itemsHtml += `
      <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
        <div style="font-weight: 600; color: #0f172a;">${item.product_name_snapshot || "Product"}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
          Category: ${item.product_category_snapshot || "N/A"}<br>
          SKU: ${item.product_sku_snapshot || "N/A"}<br>
          Qty: ${item.quantity} &times; Rs. ${parseFloat(item.unit_price_snapshot || 0).toLocaleString()}<br>
          <a href="${productLink}" target="_blank" style="color:#2563eb;">View Product</a>
        </div>
      </div>`;
    });

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
      <div class="row"><span class="label">Address</span><span class="value">${order.address || order.shipping_address || "N/A"}</span></div>
      <div class="row"><span class="label">City</span><span class="value">${order.city}</span></div>
      ${order.notes ? `<div class="row"><span class="label">Notes</span><span class="value">${order.notes}</span></div>` : ""}
    </div>

    <div class="section-title">Order Details (#${shortOrderId})</div>
    <div class="order-box">
      ${itemsHtml}
      <div class="row" style="margin-top: 16px;"><span class="label">Subtotal</span><span class="value">Rs. ${subtotal.toLocaleString()}</span></div>
      <div class="row"><span class="label">Delivery Charges</span><span class="value">Rs. ${deliveryCharges.toLocaleString()}</span></div>
      <div class="row"><span class="label">Grand Total</span><span class="value">Rs. ${parseFloat(order.total || order.total_amount || 0).toLocaleString()}</span></div>
      <div class="row"><span class="label">Order Date</span><span class="value">${new Date(order.created_at).toLocaleString()}</span></div>
      <div class="row"><span class="label">Confirmed At</span><span class="value">${new Date(confirmedAt).toLocaleString()}</span></div>
    </div>
  </div>
  <div class="footer">&copy; ${new Date().getFullYear()} APlusOptics</div>
</div></body></html>`;

    if (resendApiKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "APlusOptics Orders <orders@aplusoptics.com>",
          to: ["opticsaplus@gmail.com"],
          subject: `New Confirmed Order — #${shortOrderId}`,
          html: ownerEmailHtml,
        }),
      });

      if (!resendRes.ok) {
        const resendData = await resendRes.json();
        console.error("Owner notification email failed:", JSON.stringify(resendData));
      }
    } else {
      console.error("RESEND_API_KEY missing — owner notification not sent.");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order confirmed successfully." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: `System Error: ${err.message || String(err)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
