import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local or .env
let envContent = '';
try { envContent = fs.readFileSync('.env', 'utf-8'); } catch (e) {}
try { envContent = fs.readFileSync('.env.local', 'utf-8'); } catch (e) {}

const env = {};
envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log("Keys in profiles:", data && data.length > 0 ? Object.keys(data[0]) : (error || "No data"));
    
    const { data: d2 } = await supabase.from('diagnostic_centers').select('*').limit(1);
    console.log("Keys in diagnostic_centers:", d2 && d2.length > 0 ? Object.keys(d2[0]) : "No data");
}
checkSchema();
