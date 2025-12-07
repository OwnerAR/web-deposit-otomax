import { NextRequest, NextResponse } from 'next/server';
import { decrypt, extractIdAgen } from '@/lib/decrypt';

/**
 * API route to decode Authorization header
 * Returns idagen if decode is successful
 */
export async function POST(request: NextRequest) {
  try {
    const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';

    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ No Authorization header found');
      }
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 400 }
      );
    }

    // Get environment variables
    const privateKey = process.env.DECRYPT_PRIVATE_KEY;
    const authKey = process.env.DECRYPT_AUTH_KEY;

    if (!privateKey || !authKey) {
      console.error('[API /auth/decode] ❌ Missing DECRYPT_PRIVATE_KEY or DECRYPT_AUTH_KEY environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (shouldLog) {
      const maskedHeader = authHeader.length > 30 
        ? `${authHeader.substring(0, 30)}...` 
        : authHeader;
      console.log('[API /auth/decode] Attempting to decode Authorization header:', maskedHeader);
    }

    // Decrypt the message
    const decryptedData = decrypt(authHeader, privateKey, authKey);

    if (!decryptedData) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Decryption failed');
      }
      return NextResponse.json(
        { error: 'Failed to decrypt authorization header' },
        { status: 401 }
      );
    }

    // Extract idagen from decrypted data
    const idagen = extractIdAgen(decryptedData);

    if (!idagen) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Failed to extract idagen from decrypted data');
      }
      return NextResponse.json(
        { error: 'Failed to extract idagen from decrypted data' },
        { status: 400 }
      );
    }

    if (shouldLog) {
      console.log('[API /auth/decode] ✅ Successfully decoded, idagen:', idagen);
    }

    return NextResponse.json({ idagen });
  } catch (error) {
    console.error('[API /auth/decode] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

