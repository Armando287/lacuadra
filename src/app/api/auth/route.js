import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readDB, writeDB } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password, isRegister, favoriteClub } = await request.json();
    
    // Supabase intent
    try {
      const { data: users, error } = await supabase.from('users').select('*').eq('username', username);
      if (!error && users && users.length > 0) {
        if (isRegister) return NextResponse.json({ success: false, error: 'Usuario ya existe' });
        const user = users[0];
        if (user.password === password) {
          const { password: _, ...userWithoutPassword } = user;
          return NextResponse.json({ success: true, user: userWithoutPassword });
        }
      } else if (!error && users && users.length === 0 && isRegister) {
        // Create user in Supabase
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        const { data: newUser, error: insertError } = await supabase.from('users').insert([{ username, password, avatar_url: avatarUrl, favorite_club: favoriteClub }]).select();
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
    const existingUser = db.users.find(u => u.username === username);

    if (existingUser) {
      if (isRegister) return NextResponse.json({ success: false, error: 'El usuario ya existe.' });
      if (existingUser.password === password) {
        const { password: _, ...userWithoutPassword } = existingUser;
        return NextResponse.json({ success: true, user: userWithoutPassword });
      } else {
        return NextResponse.json({ success: false, error: 'Contraseña incorrecta.' });
      }
    } else {
      if (!isRegister) return NextResponse.json({ success: false, error: 'El usuario no existe.' });
      const newUser = {
        id: Date.now().toString(),
        username,
        password,
        favoriteClub,
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

