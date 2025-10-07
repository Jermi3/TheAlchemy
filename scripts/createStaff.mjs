import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const ownerEmail = 'alchemy@admin.com';
const ownerPassword = 'admin123';

const staffEmail = process.argv[2];
const staffName = process.argv[3] || 'Test Staff';

if (!staffEmail) {
  console.error('Usage: node createStaff.mjs <staff-email> [display-name]');
  process.exit(1);
}

const run = async () => {
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password: ownerPassword,
  });

  if (loginError) {
    console.error('Login failed:', loginError.message);
    return;
  }

  const staffId = crypto.randomUUID();
  const linkedAuthId = staffId;

  const { data, error } = await supabase
    .from('staff_profiles')
    .insert({
      id: staffId,
      email: staffEmail,
      display_name: staffName,
      role: 'staff',
      active: true,
      auth_user_id: linkedAuthId,
    })
    .select();

  console.log('data:', data);
  console.log('error:', error?.message ?? null);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
