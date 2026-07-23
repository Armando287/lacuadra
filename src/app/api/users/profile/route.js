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

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://s3.hf.co/infovips',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'HFAKRJvAzDiCp28xL4aeGd4nuC4SxP5',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '6005347d7394e0e7fb4733e647df15297003969f92868c6e79ffa5dcae46d905',
  },
  forcePathStyle: true
});

async function deleteFromS3(fileUrl) {
  if (!fileUrl || !fileUrl.includes('?file=')) return;
  try {
    const filename = fileUrl.split('?file=')[1];
    await s3.send(new DeleteObjectCommand({
      Bucket: 'lacuadra_uploads',
      Key: filename,
    }));
    console.log("Deleted old file:", filename);
  } catch (e) {
    console.error("Failed to delete old file:", e);
  }
}

// Update a user's profile
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, phone, bio, avatar_url, cover_url } = body;

    if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    // 1. Fetch current user to get old URLs, cooldown, and password
    const { data: currentUser, error: fetchErr } = await supabase
      .from('users')
      .select('username, favorite_club, avatar_url, cover_url, last_profile_edit, password')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    
    // Check Password Change
    const { current_password, new_password } = body;
    if (current_password && new_password) {
      if (currentUser.password !== current_password) {
        return NextResponse.json({ success: false, error: 'La contraseña actual es incorrecta' }, { status: 403 });
      }
      updates.password = new_password;
    }
    
    // Check Cooldown for username and club
    const { username, favorite_club } = body;
    const isUsernameChanged = username !== undefined && username !== currentUser.username;
    const isClubChanged = favorite_club !== undefined && favorite_club !== currentUser.favorite_club;

    if (isUsernameChanged || isClubChanged) {
      if (currentUser.last_profile_edit) {
        const lastEdit = new Date(currentUser.last_profile_edit);
        const fiveMonthsAgo = new Date();
        fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
        
        if (lastEdit > fiveMonthsAgo) {
          const nextAvailableDate = new Date(lastEdit);
          nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 5);
          return NextResponse.json({ 
            success: false, 
            error: `No puedes cambiar tu nombre o club todavía. Próxima edición disponible el ${nextAvailableDate.toLocaleDateString()}` 
          }, { status: 403 });
        }
      }
      
      if (isUsernameChanged) updates.username = username;
      if (isClubChanged) updates.favorite_club = favorite_club;
      updates.last_profile_edit = new Date().toISOString();
    }

    // Check if avatar is being replaced
    if (avatar_url !== undefined) {
      if (currentUser.avatar_url && currentUser.avatar_url !== avatar_url) {
        await deleteFromS3(currentUser.avatar_url);
      }
      updates.avatar_url = avatar_url;
    }
    
    // Check if cover is being replaced
    if (cover_url !== undefined) {
      if (currentUser.cover_url && currentUser.cover_url !== cover_url) {
        await deleteFromS3(currentUser.cover_url);
      }
      updates.cover_url = cover_url;
    }

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
