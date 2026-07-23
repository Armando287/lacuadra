const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://s3.hf.co/infovips',
  credentials: {
    accessKeyId: 'HFAKRJvAzDiCp28xL4aeGd4nuC4SxP5',
    secretAccessKey: '6005347d7394e0e7fb4733e647df15297003969f92868c6e79ffa5dcae46d905',
  },
  forcePathStyle: true
});

async function test() {
  try {
    const fileKey = '1784831071579-979878333-DesdFQWW0AAQddn.jpg';
    const command = new GetObjectCommand({
      Bucket: 'lacuadra_uploads',
      Key: fileKey,
    });
    
    console.log("Generating presigned URL...");
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log("Presigned URL:", url);
    
    console.log("Fetching URL...");
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Redirected:", res.redirected);
    const buffer = await res.arrayBuffer();
    console.log("Bytes fetched:", buffer.byteLength);

  } catch (error) {
    console.error("Error:", error);
  }
}

test();
