import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readDB } from '@/lib/db';

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, points')
      .order('points', { ascending: false });
      
    if (!error && users && users.length > 0) {
      const formattedUsers = users.map(u => ({ id: u.id, username: u.username, avatarUrl: u.avatar_url, points: u.points }));
      return NextResponse.json({ leaderboard: formattedUsers });
    }
  } catch (e) {}

  // Fallback
  const db = readDB();
  const leaderboard = db.users
    .map(u => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl, points: u.points }))
    .sort((a, b) => b.points - a.points);
    
  return NextResponse.json({ leaderboard });
}

