import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/checkStaffProfile.mjs <email> <password>');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

const logSection = (title) => {
  console.log('\n=== ' + title + ' ===');
};

async function main() {
  logSection('Signing in');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  const { user, session } = authData;
  console.log('Authenticated user id:', user.id);
  console.log('Access token present:', Boolean(session?.access_token));

  logSection('Fetching staff profile');
  const { data: profiles, error: profileError } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('auth_user_id', user.id);

  if (profileError) {
    console.error('Profile query error:', profileError.message);
  } else if (!profiles || profiles.length === 0) {
    console.warn('No staff profile found for this user.');
  } else {
    console.log('Staff profile:', profiles[0]);
  }

  logSection('Fetching permissions');
  if (profiles && profiles.length > 0) {
    const staffId = profiles[0].id;
    const { data: permissions, error: permissionsError } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('staff_id', staffId);

    if (permissionsError) {
      console.error('Permissions query error:', permissionsError.message);
    } else {
      console.log('Permissions:', permissions);
    }
  } else {
    console.log('Skipping permissions query because no staff profile was found.');
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
