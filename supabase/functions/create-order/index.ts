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
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;

    // Service role client — only used server-side inside this function
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      product_id,
      quantity,
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      notes,
      lens_details,
      selected_color,
    } = body;

    // 1. INPUT VALIDATION
    if (!product_id || !quantity || !customer_name || !customer_email ||
      !customer_phone || !address || !city) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 99) {
      return new Response(
        JSON.stringify({ error: "Invalid quantity." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. VALIDATE PRODUCT (server-side — never trust browser price)
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, sku, price, sale_price, active, purchase_method, categories(name)")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!product.active) {
      return new Response(
        JSON.stringify({ error: "This product is not currently available." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (product.purchase_method !== "direct_order") {
      return new Response(
        JSON.stringify({ error: "This product does not support direct ordering." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. CALCULATE TOTAL SERVER-SIDE
    const unitPrice = product.sale_price && product.sale_price < product.price
      ? parseFloat(product.sale_price)
      : parseFloat(product.price);

    const lensPrice = lens_details?.price ? parseFloat(lens_details.price) : 0;
    const subtotal = parseFloat(((unitPrice + lensPrice) * qty).toFixed(2));
    const total = subtotal;

    const categoryName = product.categories?.name || "N/A";
    
    // Append color to product name snapshot if selected
    const productNameSnapshot = selected_color 
      ? `${product.name} (Color: ${selected_color})`
      : product.name;

    // 4. GENERATE CONFIRMATION TOKEN (cryptographically secure, server-side only)
    const confirmationToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 5. INSERT ORDER
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        address,
        shipping_address: address, // Fallback for legacy schema
        city,
        notes: notes || null,
        lens_details: lens_details || null,
        subtotal,
        total,
        total_amount: total, // Fallback for legacy schema
        status: "pending_confirmation",
        confirmation_token: confirmationToken,
        confirmation_token_expires_at: tokenExpiresAt,
      }])
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response(
        JSON.stringify({ error: `Database Error: ${orderError.message || JSON.stringify(orderError)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. INSERT ORDER ITEMS (with product snapshots)
    const { error: itemError } = await supabase
      .from("order_items")
      .insert([{
        order_id: order.id,
        product_id: product.id,
        product_name_snapshot: productNameSnapshot,
        product_sku_snapshot: product.sku || null,
        product_category_snapshot: categoryName,
        unit_price_snapshot: unitPrice,
        price_at_time: unitPrice, // Fallback for legacy schema
        quantity: qty
      }]);

    if (itemError) {
      console.error("Order item insert error:", itemError);
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to create order. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. SEND CONFIRMATION EMAIL TO CUSTOMER
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.aplusoptics.com";
    const confirmUrl = `${siteUrl}/order/confirm?token=${confirmationToken}`;
    const shortOrderId = order.id.split("-")[0].toUpperCase();

    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;}
.wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.header{background:#0F172A;padding:32px 40px;text-align:center;}
.header h1{color:#fff;margin:0;font-size:22px;}
.header p{color:#94a3b8;margin:8px 0 0;font-size:14px;}
.body{padding:40px;}
.order-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;}
.row:last-child{border-bottom:none;font-weight:700;}
.label{color:#64748b;}.value{color:#0f172a;font-weight:500;}
.confirm-btn{display:block;width:fit-content;margin:32px auto;padding:16px 40px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:700;text-align:center;}
.warning{background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-top:24px;font-size:13px;color:#92400e;}
.footer{background:#f8fafc;padding:24px;text-align:center;font-size:12px;color:#94a3b8;}
</style></head><body>
<div class="wrapper">
  <div class="header"><h1>APlusOptics</h1><p>Confirm Your Order</p></div>
  <div class="body">
    <p style="font-size:16px;color:#0f172a;">Dear <strong>${customer_name}</strong>,</p>
    <p style="color:#475569;font-size:14px;">Thank you for your order! Please confirm it by clicking the button below. Your order will not be processed until confirmed.</p>
    <div class="order-box">
      <div class="row"><span class="label">Order ID</span><span class="value">#${shortOrderId}</span></div>
      <div class="row"><span class="label">Product</span><span class="value">${product.name}</span></div>
      <div class="row"><span class="label">SKU</span><span class="value">${product.sku || "N/A"}</span></div>
      <div class="row"><span class="label">Category</span><span class="value">${categoryName}</span></div>
      ${selected_color ? `<div class="row"><span class="label">Color</span><span class="value">${selected_color}</span></div>` : ""}
      <div class="row"><span class="label">Quantity</span><span class="value">${qty}</span></div>
      <div class="row"><span class="label">Unit Price</span><span class="value">Rs. ${unitPrice.toLocaleString()}</span></div>
      ${lens_details ? `<div class="row"><span class="label">Lens Option</span><span class="value">${lens_details.name} (+ Rs. ${lensPrice.toLocaleString()})</span></div>` : ""}
      <div class="row"><span class="label">Total</span><span class="value">Rs. ${total.toLocaleString()}</span></div>
    </div>
    <div class="order-box">
      <div class="row"><span class="label">Name</span><span class="value">${customer_name}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${customer_phone}</span></div>
      <div class="row"><span class="label">Address</span><span class="value">${address}</span></div>
      <div class="row"><span class="label">City</span><span class="value">${city}</span></div>
      ${notes ? `<div class="row"><span class="label">Notes</span><span class="value">${notes}</span></div>` : ""}
    </div>
    <a href="${confirmUrl}" class="confirm-btn">CONFIRM MY ORDER</a>
    <div class="warning">This confirmation link expires in <strong>24 hours</strong>. If you did not place this order, please ignore this email.</div>
  </div>
  <div class="footer">&copy; 2026 APlusOptics</div>
</div></body></html>`;

    // Fetch Resend API Key inside this block
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY!");
      return new Response(
        JSON.stringify({ error: "Email service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "APlusOptics Orders <orders@aplusoptics.com>",
        to: [customer_email],
        subject: `Confirm Your APlusOptics Order #${shortOrderId}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend Error:", JSON.stringify(resendData));
      // Still return success — order is saved. Email issue is secondary.
    } else {
      console.log("Email sent successfully via Resend:", resendData.id);
    }

    return new Response(
      JSON.stringify({ success: true, order_id: order.id, message: "Order created. Please check your email to confirm." }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: `System Error: ${err.message || String(err)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
