import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readDB, writeDB } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  try {
    let query = supabase.from('votes').select('*');
    if (userId) query = query.eq('user_id', userId);
    
    const { data: votes, error } = await query;
    if (!error && votes) return NextResponse.json({ votes });
  } catch (e) {}
  
  const db = readDB();
  const votes = userId ? db.votes.filter(v => v.userId === userId) : db.votes;
  return NextResponse.json({ votes });
}

export async function POST(request) {
  try {
    const { userId, matchId, predictedScoreHome, predictedScoreAway } = await request.json();
    
    try {
      const { data: existingVote, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
        .eq('match_id', matchId);
        
      if (!error) {
        if (existingVote && existingVote.length > 0) {
          await supabase.from('votes').update({ predicted_score_home: predictedScoreHome, predicted_score_away: predictedScoreAway }).eq('id', existingVote[0].id);
        } else {
          await supabase.from('votes').insert([{ user_id: userId, match_id: matchId, predicted_score_home: predictedScoreHome, predicted_score_away: predictedScoreAway }]);
        }
        return NextResponse.json({ success: true });
      }
    } catch (e) {}

    // Fallback JSON
    const db = readDB();
    const existingVoteIndex = db.votes.findIndex(v => v.userId === userId && v.matchId === matchId);
    if (existingVoteIndex >= 0) {
      db.votes[existingVoteIndex] = { ...db.votes[existingVoteIndex], predictedScoreHome, predictedScoreAway };
    } else {
      db.votes.push({
        id: Date.now().toString(),
        userId,
        matchId,
        predictedScoreHome,
        predictedScoreAway,
        pointsEarned: null
      });
    }
    writeDB(db);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
}

