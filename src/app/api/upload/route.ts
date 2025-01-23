import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import sharp from 'sharp';

export async function POST(request: Request) {
  console.log('Upload route called');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file) {
      console.error('No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image with sharp
    const processedImageBuffer = await sharp(buffer)
      .resize({
        width: 1000,
        withoutEnlargement: true, // Don't enlarge if image is smaller
        fit: 'inside' // Maintain aspect ratio
      })
      .webp({ quality: 80 }) // Convert to WebP with 80% quality
      .toBuffer();

    // Modify filename to use .webp extension
    const webpFilename = filename.replace(/\.[^/.]+$/, '') + '.webp';

    // Validate environment variables
    const requiredEnvVars = {
      R2_ENDPOINT: process.env.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: process.env.R2_BUCKET,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    };

    // Check for missing environment variables
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const errorMsg = `Missing environment variables: ${missingVars.join(', ')}`;
      console.error(errorMsg);
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      );
    }

    const s3 = new AWS.S3({
      endpoint: `https://${requiredEnvVars.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      accessKeyId: requiredEnvVars.R2_ACCESS_KEY_ID,
      secretAccessKey: requiredEnvVars.R2_SECRET_ACCESS_KEY,
      region: 'auto',
      signatureVersion: 'v4',
      s3ForcePathStyle: true
    });

    if (!requiredEnvVars.R2_BUCKET) {
      throw new Error('R2_BUCKET environment variable is missing');
    }

    const uploadParams = {
      Bucket: requiredEnvVars.R2_BUCKET,
      Key: webpFilename,
      Body: processedImageBuffer,
      ContentType: 'image/webp',
      ACL: 'public-read',
    };

    try {
      const uploadResult = await s3.upload(uploadParams).promise();
      console.log('Upload successful:', uploadResult);

      // Return only the filename, not the full URL
      return NextResponse.json({ url: webpFilename });
    } catch (uploadError) {
      console.error('S3 upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload to R2', details: (uploadError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('General upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}