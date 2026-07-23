import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({ success: true, users: [] });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, bio')
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, users: data });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
