import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eiuqtyqlzsqddabwjwcq.supabase.co';
const ANON_KEY = 'sb_publishable_uGEYIXSqxOXeSheyOkHF-A_gUiDJ9-R';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Try to update an order using confirmed_at
async function testConfirm() {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('status', 'pending_confirmation')
    .select()
    .limit(1);
  
  if (error) {
    console.log("Update Error:", error.message);
  } else {
    console.log("Update Success:", data);
  }
}

testConfirm();
