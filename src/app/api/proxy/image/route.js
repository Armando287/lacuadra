import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://s3.hf.co/infovips',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'HFAKRJvAzDiCp28xL4aeGd4nuC4SxP5',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '6005347d7394e0e7fb4733e647df15297003969f92868c6e79ffa5dcae46d905',
  },
  forcePathStyle: true
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    const command = new GetObjectCommand({
      Bucket: 'lacuadra_uploads',
      Key: file,
    });

    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    const hfRes = await fetch(url);
    if (!hfRes.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const arrayBuffer = await hfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let contentType = 'image/jpeg';
    if (file.toLowerCase().endsWith('.png')) contentType = 'image/png';
    else if (file.toLowerCase().endsWith('.gif')) contentType = 'image/gif';
    else if (file.toLowerCase().endsWith('.webp')) contentType = 'image/webp';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse('Internal server error or image not found', { status: 500 });
  }
}
