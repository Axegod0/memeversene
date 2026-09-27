import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].replace(/['"]/g, '').trim();
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].replace(/['"]/g, '').trim();

const supabase = createClient(URL, KEY);

async function test() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username), rooms!inner(name, slug)')
    .eq('rooms.slug', 'kingo');
    
  console.log("With inner:", { error: error?.message, dataCount: data?.length });

  const { data: data2, error: error2 } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username), rooms(name, slug)')
    .eq('rooms.slug', 'kingo');
    
  console.log("Without inner:", { error: error2?.message, dataCount: data2?.length });
}
test();
