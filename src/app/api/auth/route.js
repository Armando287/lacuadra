import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { username, password, isRegister, favoriteClub } = await request.json();
    
    // Check if user exists
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username);

    if (fetchError) {
      console.error(fetchError);
      return NextResponse.json({ success: false, error: 'Error de conexión con la base de datos' });
    }

    const userExists = users && users.length > 0;

    if (isRegister) {
      if (userExists) {
        return NextResponse.json({ success: false, error: 'El usuario ya existe.' });
      }

      // Create new user
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ username, password, avatar_url: avatarUrl, favorite_club: favoriteClub }])
        .select();

      if (insertError) {
        console.error(insertError);
        return NextResponse.json({ success: false, error: 'Error al registrar el usuario' });
      }

      if (newUser && newUser.length > 0) {
        const { password: _, ...userWithoutPassword } = newUser[0];
        return NextResponse.json({ success: true, user: userWithoutPassword });
      }
    } else {
      // Login
      if (!userExists) {
        return NextResponse.json({ success: false, error: 'El usuario no existe.' });
      }

      const user = users[0];
      if (user.is_banned) {
        return NextResponse.json({ success: false, error: 'Tu cuenta ha sido suspendida.' });
      }
      if (user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ success: true, user: userWithoutPassword });
      } else {
        return NextResponse.json({ success: false, error: 'Contraseña incorrecta.' });
      }
    }

    return NextResponse.json({ success: false, error: 'Operación no válida' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
}

