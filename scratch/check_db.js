
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: p } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles keys:', Object.keys(p[0] || {}));
  const { data: c } = await supabase.from('connections').select('*').limit(1);
  console.log('Connections keys:', Object.keys(c[0] || {}));
}
run();

