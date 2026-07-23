import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get a user's public profile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update a user's profile
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, phone, bio, avatar_url, cover_url } = body;

    if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (cover_url !== undefined) updates.cover_url = cover_url;

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
