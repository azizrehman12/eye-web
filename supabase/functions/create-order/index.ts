import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeCategoryName(name: string | null | undefined): string {
  return (name || "").toLowerCase().trim();
}

function isSunglassesOrFrameCategory(category: string | null | undefined): boolean {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return false;

  return (
    normalized === "sunglasses" ||
    normalized === "frame" ||
    normalized === "frames" ||
    normalized === "eyeglasses" ||
    normalized === "eyeglass" ||
    normalized.includes("sunglasses") ||
    normalized.includes("frame") ||
    normalized.includes("eyeglass")
  );
}

function isWhatsAppOnlyCategory(category: string | null | undefined): boolean {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return false;

  return (
    normalized.includes("contact") ||
    normalized.includes("screen") ||
    normalized.includes("intelligent")
  );
}

function isGenderShopCategory(category: string | null | undefined): boolean {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return false;

  return (
    normalized === "men's" ||
    normalized === "mens" ||
    normalized === "women's" ||
    normalized === "womens"
  );
}

function isEmailEligibleProduct(
  categoryName: string,
  purchaseMethod: string | null | undefined
): boolean {
  if (isWhatsAppOnlyCategory(categoryName)) return false;
  if (isSunglassesOrFrameCategory(categoryName)) return true;
  if (isGenderShopCategory(categoryName) && purchaseMethod === "direct_order") return true;
  return false;
}

function hasActualLensSelected(lensDetails: { id?: string; name?: string } | null | undefined): boolean {
  if (!lensDetails) return false;
  if (lensDetails.id === "no-lens-default") return false;
  if (lensDetails.name === "No Lens Selected") return false;
  if (typeof lensDetails.id === "string" && lensDetails.id.startsWith("no-lens")) return false;
  return true;
}

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
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server Configuration Error: service role key is missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      items, // array of { product_id, quantity, selected_color, lens_details }
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      notes,
    } = body;

    // 1. INPUT VALIDATION
    if (!items || !Array.isArray(items) || items.length === 0 || !customer_name || !customer_email || !customer_phone || !address || !city) {
      return new Response(
        JSON.stringify({ error: "Missing required fields or empty cart." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subtotal = 0;
    const DELIVERY_CHARGES = 300;
    const validatedItems = [];

    // 2. VALIDATE PRODUCTS & CALCULATE SUBTOTAL
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1 || qty > 99) {
        return new Response(JSON.stringify({ error: "Invalid quantity for a product." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, sku, price, sale_price, active, purchase_method, available_colors, categories(name)")
        .eq("id", item.product_id)
        .single();

      if (productError || !product) {
        return new Response(JSON.stringify({ error: `Product not found (ID: ${item.product_id}).` }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!product.active) {
        return new Response(JSON.stringify({ error: `Product ${product.name} is not currently available.` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const categoryName = product.categories?.name || "";
      const isEligible = isEmailEligibleProduct(categoryName, product.purchase_method);
      const hasLens = hasActualLensSelected(item.lens_details);

      if (!isEligible || hasLens) {
        return new Response(JSON.stringify({ error: `Cart contains items that require WhatsApp ordering. Cart cannot be processed via Email checkout.` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Validate color
      if (product.available_colors && product.available_colors.length > 0) {
        if (!item.selected_color || !product.available_colors.includes(item.selected_color)) {
          return new Response(JSON.stringify({ error: `Invalid or missing color selection for ${product.name}.` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      const unitPrice = product.sale_price && product.sale_price < product.price
        ? parseFloat(product.sale_price)
        : parseFloat(product.price);

      const lensPrice = hasActualLensSelected(item.lens_details) && item.lens_details?.price
        ? parseFloat(item.lens_details.price)
        : 0;
      const itemTotal = (unitPrice + lensPrice) * qty;
      subtotal += itemTotal;

      let productNameSnapshot = product.name;
      if (item.selected_color) productNameSnapshot += ` (Color: ${item.selected_color})`;
      if (hasActualLensSelected(item.lens_details)) {
        productNameSnapshot += ` + ${item.lens_details.name}`;
      }

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        qty: qty,
        unitPrice: unitPrice,
        lensDetails: item.lens_details,
        lensPrice: lensPrice,
        selectedColor: item.selected_color,
        itemTotal: itemTotal,
        categoryName: categoryName || "N/A",
        sku: product.sku,
        productNameSnapshot: productNameSnapshot
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const total = subtotal + DELIVERY_CHARGES;

    const confirmationToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store first item's lens details in the main order table just for backward compatibility if needed
    const primaryLensDetails = validatedItems.find(i => i.lensDetails)?.lensDetails || null;

    // 3. INSERT ORDER
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        address,
        shipping_address: address,
        city,
        notes: notes || null,
        lens_details: primaryLensDetails, // legacy support
        subtotal,
        total,
        total_amount: total, // Fallback for legacy schema
        // We'll pass delivery_charges just in case the column exists, if it fails we remove it. 
        // Actually, Supabase inserts fail if a column doesn't exist. 
        // To be safe, we rely on total = subtotal + 300. We can add it in a migration later.
        status: "pending_confirmation",
        confirmation_token: confirmationToken,
        confirmation_token_expires_at: tokenExpiresAt,
      }])
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response(JSON.stringify({ error: `Database Error: ${orderError.message || JSON.stringify(orderError)}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. INSERT ORDER ITEMS
    const orderItemsToInsert = validatedItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name_snapshot: item.productNameSnapshot,
      product_sku_snapshot: item.sku || null,
      product_category_snapshot: item.categoryName,
      unit_price_snapshot: item.unitPrice,
      price_at_time: item.unitPrice, // legacy support
      quantity: item.qty
    }));

    const { error: itemError } = await supabase.from("order_items").insert(orderItemsToInsert);

    if (itemError) {
      console.error("Order item insert error:", itemError);
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Failed to create order. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 5. SEND CONFIRMATION EMAIL TO CUSTOMER
    let siteUrl = Deno.env.get("SITE_URL");
    const origin = req.headers.get("origin");

    if (!siteUrl) {
      if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
        siteUrl = origin;
      } else if (origin && origin.includes("aplusoptics.com")) {
        siteUrl = origin;
      } else {
        // Fallback for production so it works automatically without requiring CLI secrets
        siteUrl = "https://www.aplusoptics.com";
      }
    }
    const confirmUrl = `${siteUrl}/order/confirm?token=${confirmationToken}`;
    const shortOrderId = order.id.split("-")[0].toUpperCase();

    let itemsHtml = '';
    validatedItems.forEach(item => {
      itemsHtml += `
        <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #0f172a;">${item.name}</div>
          <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
            ${item.selectedColor ? `Color: ${item.selectedColor}<br>` : ''}
            ${item.lensDetails && item.lensDetails.id !== 'no-lens-default' ? `Lens: ${item.lensDetails.name} (+ Rs. ${item.lensPrice})<br>` : ''}
            Qty: ${item.qty} &times; Rs. ${item.unitPrice + item.lensPrice}
          </div>
          <div style="font-weight: 600; color: #0f172a; text-align: right;">Rs. ${item.itemTotal.toLocaleString()}</div>
        </div>
      `;
    });

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
.row:last-child{border-bottom:none;}
.total-row{font-size:16px; font-weight:700; color:#0f172a;}
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
      <div style="font-weight:700; margin-bottom:12px; color:#0f172a;">Order Summary (#${shortOrderId})</div>
      ${itemsHtml}
      <div class="row" style="margin-top: 16px;"><span class="label">Subtotal</span><span class="value">Rs. ${subtotal.toLocaleString()}</span></div>
      <div class="row"><span class="label">Delivery Charges</span><span class="value">Rs. ${DELIVERY_CHARGES.toLocaleString()}</span></div>
      <div class="row total-row"><span class="label">Grand Total</span><span class="value">Rs. ${total.toLocaleString()}</span></div>
    </div>

    <div class="order-box">
      <div style="font-weight:700; margin-bottom:12px; color:#0f172a;">Delivery Details</div>
      <div class="row"><span class="label">Name</span><span class="value">${customer_name}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${customer_phone}</span></div>
      <div class="row"><span class="label">Address</span><span class="value">${address}</span></div>
      <div class="row"><span class="label">City</span><span class="value">${city}</span></div>
      ${notes ? `<div class="row"><span class="label">Notes</span><span class="value">${notes}</span></div>` : ""}
    </div>
    <a href="${confirmUrl}" class="confirm-btn">CONFIRM MY ORDER</a>
    <div class="warning">This confirmation link expires in <strong>24 hours</strong>. If you did not place this order, please ignore this email.</div>
  </div>
  <div class="footer">&copy; ${new Date().getFullYear()} APlusOptics</div>
</div></body></html>`;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY!");
      return new Response(JSON.stringify({ error: "Email service is not configured." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    } else {
      console.log("Email sent successfully via Resend:", resendData.id);
    }

    return new Response(
      JSON.stringify({ success: true, order_id: order.id, message: "Order created. Please check your email to confirm." }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: `System Error: ${err.message || String(err)}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
