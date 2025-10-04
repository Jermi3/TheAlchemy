import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const run = async () => {
  const { data, error } = await supabase.from('staff_profiles').select('*').limit(5);

  if (error) {
    console.error('Query error:', error.message);
    return;
  }

  console.log('Rows:', data);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
