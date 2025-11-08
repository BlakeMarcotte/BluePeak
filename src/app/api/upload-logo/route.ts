import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Logo upload request received');

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📁 File received:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('✅ File converted to buffer:', buffer.length, 'bytes');

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `logos/${timestamp}_${sanitizedName}`;
    console.log('📝 Generated filename:', filename);

    // Upload to Firebase Storage
    console.log('🔥 Attempting Firebase Storage upload...');
    const bucket = adminStorage.bucket();
    console.log('📦 Bucket name:', bucket.name);

    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    console.log('✅ File saved to storage');

    // Make file publicly accessible
    await fileRef.makePublic();
    console.log('✅ File made public');

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    console.log('✅ Public URL:', publicUrl);

    return NextResponse.json({
      logoUrl: publicUrl,
      filename: filename,
    });
  } catch (error: any) {
    console.error('❌ Logo upload error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to upload logo',
        details: error.message
      },
      { status: 500 }
    );
  }
}
