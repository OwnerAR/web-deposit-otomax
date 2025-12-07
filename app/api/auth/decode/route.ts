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

// Force dynamic rendering because we use searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const signature = searchParams.get('signature');
    const paymentMethod = searchParams.get('paymentMethod');
    
    if (!key || !signature || !paymentMethod) {
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    const privateKey = process.env.DECRYPT_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('[API /auth/decode] Missing DECRYPT_PRIVATE_KEY environment variable');
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    const decryptedData = decrypt(signature, privateKey, key);
    
    if (!decryptedData) {
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    const idagen = extractIdAgen(decryptedData);
    
    if (!idagen) {
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    // Redirect to /[paymentMethod]/[idagen] page
    const redirectUrl = new URL(`/${paymentMethod}/${idagen}`, request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('[API /auth/decode] Error:', error);
    return NextResponse.redirect(new URL('/not-found', request.url));
  }
}
