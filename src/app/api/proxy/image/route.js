import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://s3.hf.co/infovips',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return new NextResponse('Faltan credenciales AWS en el servidor.', { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: 'lacuadra_uploads',
      Key: file,
    });

    const response = await s3.send(command);
    
    // Convert ReadableStream to byte array (available in AWS SDK v3)
    const bytes = await response.Body.transformToByteArray();

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse('Internal server error or image not found', { status: 500 });
  }
}
