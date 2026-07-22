import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readDB, writeDB } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // Supabase intent
    try {
      const { data: users, error } = await supabase.from('users').select('*').eq('username', username);
      if (!error && users && users.length > 0) {
        const user = users[0];
        if (user.password === password) {
          const { password: _, ...userWithoutPassword } = user;
          return NextResponse.json({ success: true, user: userWithoutPassword });
        }
      } else if (!error && users && users.length === 0) {
        // Create user in Supabase
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        const { data: newUser, error: insertError } = await supabase.from('users').insert([{ username, password, avatar_url: avatarUrl }]).select();
        if (!insertError && newUser && newUser.length > 0) {
          const { password: _, ...userWithoutPassword } = newUser[0];
          return NextResponse.json({ success: true, user: userWithoutPassword });
        }
      }
    } catch (e) {
      // Fallback
    }

    // JSON Fallback
    const db = readDB();
    const user = db.users.find(u => u.username === username && u.password === password);

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json({ success: true, user: userWithoutPassword });
    } else {
      const newUser = {
        id: Date.now().toString(),
        username,
        password,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        points: 0
      };
      db.users.push(newUser);
      writeDB(db);
      
      const { password: _, ...userWithoutPassword } = newUser;
      return NextResponse.json({ success: true, user: userWithoutPassword });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
}

