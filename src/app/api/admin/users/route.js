import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all users
export async function GET(request) {
  try {
    const { data: users, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    // Remove passwords for security
    const safeUsers = users.map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// UPDATE user (ban, make admin, etc.)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, is_banned, is_admin, points } = body;

    if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    const updates = {};
    if (is_banned !== undefined) updates.is_banned = is_banned;
    if (is_admin !== undefined) updates.is_admin = is_admin;
    if (points !== undefined) updates.points = points;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, user: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
