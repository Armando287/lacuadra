import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'start') {
      const { filename, contentType } = await request.json();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeFilename = uniqueSuffix + '-' + filename.replace(/\\s+/g, '_');
      
      const command = new CreateMultipartUploadCommand({
        Bucket: 'lacuadra_uploads',
        Key: safeFilename,
        ContentType: contentType,
      });
      const res = await s3.send(command);
      return NextResponse.json({ success: true, uploadId: res.UploadId, filename: safeFilename });
    }

    if (action === 'uploadPart') {
      const formData = await request.formData();
      const file = formData.get('file');
      const uploadId = formData.get('uploadId');
      const filename = formData.get('filename');
      const partNumber = parseInt(formData.get('partNumber'), 10);
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const command = new UploadPartCommand({
        Bucket: 'lacuadra_uploads',
        Key: filename,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: buffer,
      });
      const res = await s3.send(command);
      return NextResponse.json({ success: true, ETag: res.ETag });
    }

    if (action === 'complete') {
      const { uploadId, filename, parts, contentType } = await request.json();
      
      const command = new CompleteMultipartUploadCommand({
        Bucket: 'lacuadra_uploads',
        Key: filename,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });
      await s3.send(command);
      
      const proxyUrl = `/api/proxy/image?file=${filename}`;
      return NextResponse.json({ success: true, url: proxyUrl, contentType });
    }

    // Default: Single part upload for backwards compatibility
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.name.replace(/\\s+/g, '_');

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

import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: 'No url provided' }, { status: 400 });
    }

    // Extract filename from the proxy URL format: /api/proxy/image?file=FILENAME
    let filename = fileUrl;
    if (fileUrl.includes('?file=')) {
      filename = fileUrl.split('?file=')[1];
    }

    if (!filename) {
      return NextResponse.json({ success: false, error: 'Invalid file format' }, { status: 400 });
    }

    const command = new DeleteObjectCommand({
      Bucket: 'lacuadra_uploads',
      Key: filename,
    });

    await s3.send(command);

    return NextResponse.json({ success: true, message: 'File deleted from S3' });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
