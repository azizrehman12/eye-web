import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eiuqtyqlzsqddabwjwcq.supabase.co';
const ANON_KEY = 'sb_publishable_uGEYIXSqxOXeSheyOkHF-A_gUiDJ9-R';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log("Products schema:", Object.keys(data?.[0] || {}));
}

checkSchema();
