import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eiuqtyqlzsqddabwjwcq.supabase.co';
const ANON_KEY = 'sb_publishable_uGEYIXSqxOXeSheyOkHF-A_gUiDJ9-R';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkOrderItems() {
  const payload = {
    order_id: '123e4567-e89b-12d3-a456-426614174000',
    product_id: 'fab3f544-a35e-4da6-8a55-3934ba78f40b',
    product_name_snapshot: 'Test Product',
    product_sku_snapshot: 'TEST-123',
    product_category_snapshot: 'Test Cat',
    unit_price_snapshot: 10.99,
    quantity: 1,
    price_at_time: 10.99,
  };

  console.log("Testing insert into order_items...");
  const { data, error } = await supabase.from('order_items').insert([payload]);
  
  console.log("Result:", error || "Success");
}

checkOrderItems();
