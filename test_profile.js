import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wusyykhngnxglvftrmrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1c3l5a2huZ254Z2x2ZnRybXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDE4MTksImV4cCI6MjA4NzYxNzgxOX0.t4HrTIT-NQida5UgA56M6IGVkuf2RDLt1zI19mAhH_I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetchProfile(userId) {
  console.log('Testing fetchProfile for:', userId);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  console.log('Result:', { data, error });
}

async function run() {
  const userId = '1605938f-c8d5-42c2-ac40-bafd6d07f079'; // sanjaycold499@gmail.com
  await testFetchProfile(userId);
}

run();
