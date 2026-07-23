import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://s3.hf.co/infovips',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.name.replace(/\s+/g, '_');

    let contentType = 'image/jpeg';
    if (filename.toLowerCase().endsWith('.png')) contentType = 'image/png';
    else if (filename.toLowerCase().endsWith('.gif')) contentType = 'image/gif';
    else if (filename.toLowerCase().endsWith('.webp')) contentType = 'image/webp';

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({ success: false, error: 'Faltan credenciales AWS_ACCESS_KEY_ID en el servidor.' }, { status: 500 });
    }

    const command = new PutObjectCommand({
      Bucket: 'lacuadra_uploads',
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);

    // Instead of giving the public S3 url, we will return our proxy URL
    const proxyUrl = `/api/proxy/image?file=${filename}`;

    return NextResponse.json({ success: true, url: proxyUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
