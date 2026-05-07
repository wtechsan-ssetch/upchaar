import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wusyykhngnxglvftrmrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1c3l5a2huZ254Z2x2ZnRybXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDE4MTksImV4cCI6MjA4NzYxNzgxOX0.t4HrTIT-NQida5UgA56M6IGVkuf2RDLt1zI19mAhH_I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: d1, error: err1 } = await supabase.from('diagnostic_centers').select('*');
  console.log('diagnostic_centers:', err1 ? err1.message : d1);

  const { data: d2, error: err2 } = await supabase.from('diagnostic_centres').select('*');
  console.log('diagnostic_centres:', err2 ? err2.message : d2);
}

run();
