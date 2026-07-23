import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://s3.hf.co/infovips',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'HFAKRJvAzDiCp28xL4aeGd4nuC4SxP5',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '6005347d7394e0e7fb4733e647df15297003969f92868c6e79ffa5dcae46d905',
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

    let contentType = 'application/octet-stream';
    const lowerName = filename.toLowerCase();
    
    // Images
    if (lowerName.endsWith('.png')) contentType = 'image/png';
    else if (lowerName.endsWith('.gif')) contentType = 'image/gif';
    else if (lowerName.endsWith('.webp')) contentType = 'image/webp';
    else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) contentType = 'image/jpeg';
    
    // Videos
    else if (lowerName.endsWith('.mp4')) contentType = 'video/mp4';
    else if (lowerName.endsWith('.webm')) contentType = 'video/webm';
    else if (lowerName.endsWith('.mov')) contentType = 'video/quicktime';

    const command = new PutObjectCommand({
      Bucket: 'lacuadra_uploads',
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);

    // Instead of giving the public S3 url, we will return our proxy URL
    const proxyUrl = `/api/proxy/image?file=${filename}`;

    return NextResponse.json({ success: true, url: proxyUrl, contentType: contentType });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
