import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*, user:users(username, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, posts: data });
  } catch (error) {
    console.error("GET posts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user_id, content, media_url, media_type } = await request.json();

    if (!user_id || (!content && !media_url)) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    // 1. Fetch user to check ban status and warnings
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('warning_count, banned_until')
      .eq('id', user_id)
      .single();

    if (userError) throw userError;

    if (user.banned_until) {
      const banDate = new Date(user.banned_until);
      if (banDate > new Date()) {
        return NextResponse.json({ success: false, error: `Estás baneado hasta ${banDate.toLocaleString()}` }, { status: 403 });
      }
    }

    // 2. Moderation Bot Logic (Text Filter)
    const badWords = ['porno', 'puta', 'puto', 'mierda', 'fraude', 'sorteo falso', 'estafa', 'desnudo', 'sexo'];
    const lowerContent = (content || '').toLowerCase();
    
    // Check if content contains any bad words
    const isBad = badWords.some(word => lowerContent.includes(word));
    
    // Check if media is provided (simulating image scan - would call external API here)
    // const isImageBad = media_url ? await externalAIScan(media_url) : false;

    if (isBad) {
      const newWarnings = (user.warning_count || 0) + 1;
      let updateData = { warning_count: newWarnings };
      let message = `🤖 El Bot de Seguridad ha eliminado tu publicación por infringir las normas comunitarias (obscenidad o fraude). Advertencia ${newWarnings}/3.`;

      if (newWarnings >= 3) {
        // Ban for 24 hours
        const banUntil = new Date();
        banUntil.setHours(banUntil.getHours() + 24);
        updateData.banned_until = banUntil.toISOString();
        message = `⛔ Has sido BANEADO por 24 horas debido a faltas reiteradas a las normas comunitarias.`;
      }

      // Update User
      await supabase.from('users').update(updateData).eq('id', user_id);

      // Create Notification
      await supabase.from('notifications').insert([{
        user_id,
        title: newWarnings >= 3 ? 'Cuenta Suspendida' : 'Publicación Eliminada',
        message,
        is_read: false
      }]);

      return NextResponse.json({ success: false, error: 'Publicación bloqueada por el bot de moderación.' }, { status: 406 });
    }

    // 3. Save Post (If safe)
    const { data, error } = await supabase
      .from('posts')
      .insert([{ user_id, content, media_url, media_type }])
      .select('*, user:users(username, avatar_url)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post: data });
  } catch (error) {
    console.error("POST posts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
