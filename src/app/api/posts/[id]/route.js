import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    console.log("Deleted post media:", filename);
  } catch (e) {
    console.error("Failed to delete post media:", e);
  }
}

// EDIT post content
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content, user_id } = body;

    if (!id || !user_id) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Verify ownership
    const { data: post, error: fetchErr } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;
    if (post.user_id !== user_id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ content })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, post: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE post
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Get the post to check media_url and ownership
    const { data: post, error: fetchErr } = await supabase
      .from('posts')
      .select('user_id, media_url')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;
    if (post.user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // If post has media, delete from S3
    if (post.media_url) {
      await deleteFromS3(post.media_url);
    }

    // Delete post from Supabase
    const { error: delErr } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
