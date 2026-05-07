import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wusyykhngnxglvftrmrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1c3l5a2huZ254Z2x2ZnRybXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDE4MTksImV4cCI6MjA4NzYxNzgxOX0.t4HrTIT-NQida5UgA56M6IGVkuf2RDLt1zI19mAhH_I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: facilities, error: err } = await supabase.from('facilities').select('*');
  if (err) {
    console.error('Facilities err:', err.message);
  } else {
    console.log('Facilities rows:', facilities.length, facilities.map(f => f.type));
    console.log('Sample diagnostic:', facilities.find(f => f.type === 'diagnostic' || f.type === 'diagnostics'));
  }
}

run();
