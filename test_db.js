import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eiuqtyqlzsqddabwjwcq.supabase.co';
const ANON_KEY = 'sb_publishable_uGEYIXSqxOXeSheyOkHF-A_gUiDJ9-R';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function runFullInsert() {
  const payload = {
    customer_name: 'Test',
    customer_email: 'test@test.com',
    customer_phone: '123',
    address: '123 Test St',
    shipping_address: '123 Test St',
    city: 'Test City',
    notes: null,
    subtotal: 10.99,
    total: 10.99,
    total_amount: 10.99,
    status: "pending_confirmation",
    confirmation_token: "123e4567-e89b-12d3-a456-426614174000",
    confirmation_token_expires_at: new Date().toISOString(),
  };

  console.log("Testing insert into orders...");
  const { error: orderError } = await supabase.from('orders').insert([payload]);
  
  if (orderError) {
    console.error("Order Insert Failed:", orderError);
    return;
  }
  console.log("Order Inserted (anonymously)");

  const itemPayload = {
    order_id: '123e4567-e89b-12d3-a456-426614174000',
    product_id: 'fab3f544-a35e-4da6-8a55-3934ba78f40b',
    product_name_snapshot: 'Test Product',
    product_sku_snapshot: 'TEST-123',
    product_category_snapshot: 'Test Cat',
    unit_price_snapshot: 10.99,
    price_at_time: 10.99,
    quantity: 1,
  };

  console.log("Testing insert into order_items...");
  const { error: itemError } = await supabase.from('order_items').insert([itemPayload]);
  
  if (itemError && itemError.code !== '23503') {
    console.error("Order Items Insert Failed:", itemError);
  } else {
    console.log("Order Items Insert Success (or expected FK error)");
  }
}

runFullInsert();
