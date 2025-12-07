import { NextRequest, NextResponse } from 'next/server';
import { decrypt, extractIdAgen } from '@/lib/decrypt';

/**
 * API Route untuk decode Authorization header dan redirect
 * Menggunakan Node.js runtime (bukan Edge Runtime) sehingga bisa menggunakan crypto module
 * 
 * Query params:
 * - key: Auth key dari Authorization header
 * - signature: Signature dari Authorization header
 * - paymentMethod: Payment method route (vabank, ewallet, qris, retail)
 */
export async function GET(request: NextRequest) {
  try {
    const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const signature = searchParams.get('signature');
    const paymentMethod = searchParams.get('paymentMethod');
    
    if (shouldLog) {
      console.log('[API /auth/decode] Received decode request');
      console.log('[API /auth/decode] Payment method:', paymentMethod);
    }
    
    if (!key || !signature || !paymentMethod) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Missing key, signature, or paymentMethod');
      }
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    const privateKey = process.env.DECRYPT_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('[API /auth/decode] ❌ Missing DECRYPT_PRIVATE_KEY environment variable');
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    if (shouldLog) {
      console.log('[API /auth/decode] Attempting to decode signature...');
    }
    
    const decryptedData = decrypt(signature, privateKey, key);
    
    if (!decryptedData) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Decryption failed');
      }
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    const idagen = extractIdAgen(decryptedData);
    
    if (!idagen) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Failed to extract idagen from decrypted data');
        console.log('[API /auth/decode] Decrypted data:', decryptedData);
      }
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    if (shouldLog) {
      console.log('[API /auth/decode] ✅ Successfully decoded, idagen:', idagen);
      console.log('[API /auth/decode] 🔄 Redirecting to /' + paymentMethod + '/' + idagen);
    }
    
    // Redirect to /[paymentMethod]/[idagen] page
    const redirectUrl = new URL(`/${paymentMethod}/${idagen}`, request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('[API /auth/decode] Error:', error);
    return NextResponse.redirect(new URL('/not-found', request.url));
  }
}

/**
 * POST endpoint untuk decode (used by middleware if fetch works)
 */
export async function POST(request: NextRequest) {
  try {
    const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    const body = await request.json();
    const { key, signature } = body;
    
    if (!key || !signature) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Missing key or signature');
      }
      return NextResponse.json(
        { error: 'Missing key or signature' },
        { status: 400 }
      );
    }
    
    const privateKey = process.env.DECRYPT_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('[API /auth/decode] ❌ Missing DECRYPT_PRIVATE_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (shouldLog) {
      console.log('[API /auth/decode] Attempting to decode signature...');
    }
    
    const decryptedData = decrypt(signature, privateKey, key);
    
    if (!decryptedData) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Decryption failed');
      }
      return NextResponse.json(
        { error: 'Decryption failed' },
        { status: 400 }
      );
    }
    
    const idagen = extractIdAgen(decryptedData);
    
    if (!idagen) {
      if (shouldLog) {
        console.log('[API /auth/decode] ❌ Failed to extract idagen from decrypted data');
        console.log('[API /auth/decode] Decrypted data:', decryptedData);
      }
      return NextResponse.json(
        { error: 'Failed to extract idagen' },
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
