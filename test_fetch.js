import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].replace(/['"]/g, '').trim();
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].replace(/['"]/g, '').trim();

fetch(`${URL}/rest/v1/posts?select=*,profiles!posts_user_id_fkey(username),rooms(name,slug)`, {
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)));
