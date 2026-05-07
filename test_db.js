import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wusyykhngnxglvftrmrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1c3l5a2huZ254Z2x2ZnRybXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDE4MTksImV4cCI6MjA4NzYxNzgxOX0.t4HrTIT-NQida5UgA56M6IGVkuf2RDLt1zI19mAhH_I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: profiles, error: err1 } = await supabase.from('profiles').select('profile_type');
  if (err1) console.error('Profiles err:', err1);
  else {
    const types = [...new Set(profiles.map(p => p.profile_type))];
    console.log('Profile Types:', types);
  }

  const { data: diagnostics, error: err2 } = await supabase.from('diagnostics').select('*').limit(5);
  if (err2) {
    console.error('Diagnostics err:', err2.message);
  } else {
    console.log('Diagnostics rows:', diagnostics);
  }
}

run();
