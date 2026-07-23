import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) return console.log("No users found");
  
  const id = users[0].id;
  console.log("Updating user:", id);
  const { data, error } = await supabase.from('users').update({ bio: 'test' }).eq('id', id);
  console.log("Update Error:", error);
}

check();
