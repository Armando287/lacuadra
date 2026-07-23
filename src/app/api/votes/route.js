import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  try {
    let query = supabase.from('votes').select('*');
    if (userId) query = query.eq('user_id', userId);
    
    const { data: votes, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ votes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ votes: [] });
  }
}

export async function POST(request) {
  try {
    const { userId, matchId, predictedScoreHome, predictedScoreAway } = await request.json();
    
    // Check ban status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('banned_until')
      .eq('id', userId)
      .single();

    if (!userError && user?.banned_until) {
      const banDate = new Date(user.banned_until);
      if (banDate > new Date()) {
        return NextResponse.json({ success: false, error: `Estás baneado hasta ${banDate.toLocaleString()}` }, { status: 403 });
      }
    }

    const { data: existingVote, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId);
      
    if (error) throw error;

    if (existingVote && existingVote.length > 0) {
      await supabase.from('votes').update({ 
        predicted_score_home: predictedScoreHome, 
        predicted_score_away: predictedScoreAway 
      }).eq('id', existingVote[0].id);
    } else {
      await supabase.from('votes').insert([{ 
        user_id: userId, 
        match_id: matchId, 
        predicted_score_home: predictedScoreHome, 
        predicted_score_away: predictedScoreAway 
      }]);
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
}

