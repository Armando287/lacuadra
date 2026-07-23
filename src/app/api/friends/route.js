import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET friends for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    // Fetch friendships where user is requester OR receiver
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*, requester:users!requester_id(id, username, avatar_url), receiver:users!receiver_id(id, username, avatar_url)')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;

    return NextResponse.json({ success: true, friendships });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Send Friend Request
export async function POST(request) {
  try {
    const { requester_id, receiver_id } = await request.json();

    if (!requester_id || !receiver_id) {
      return NextResponse.json({ success: false, error: 'Both IDs are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('friendships')
      .insert([{ requester_id, receiver_id, status: 'pending' }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, request: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Accept or reject friend request
export async function PATCH(request) {
  try {
    const { id, status } = await request.json(); // status: 'accepted' or 'rejected'

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
    }

    if (status === 'rejected') {
      const { error } = await supabase.from('friendships').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Friend request deleted' });
    }

    const { data, error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, request: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
