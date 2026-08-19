import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eiuqtyqlzsqddabwjwcq.supabase.co';
const ANON_KEY = 'sb_publishable_uGEYIXSqxOXeSheyOkHF-A_gUiDJ9-R';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testInsert() {
  const payload = {
    customer_name: 'Test',
    customer_email: 'test@test.com',
    customer_phone: '123',
    address: '123 Test St',
    city: 'Test City',
    notes: null,
    subtotal: 10.99,
    total: 10.99,
    status: "pending_confirmation",
    confirmation_token: "123e4567-e89b-12d3-a456-426614174000",
    confirmation_token_expires_at: new Date().toISOString(),
  };

  console.log("Testing insert into orders...");
  const { data, error } = await supabase.from('orders').insert([payload]);
  
  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("INSERT SUCCESS:", data);
  }
}

testInsert();
