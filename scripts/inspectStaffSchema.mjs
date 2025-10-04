import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const logTable = async (table) => {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', table)
    .order('ordinal_position');

  if (error) {
    console.error('Failed to inspect', table, error.message);
  } else {
    console.log(`\nColumns for ${table}:`);
    data.forEach((col) => console.log(`- ${col.column_name} (${col.data_type})`));
  }
};

const run = async () => {
  await logTable('staff_profiles');
  await logTable('staff_permissions');
};

run().catch((err) => {
  console.error('Unexpected error', err);
  process.exit(1);
});
