import crypto from 'crypto';
import { sha3_512 } from 'js-sha3';

/**
 * HMAC-SHA3-512 implementation
 * Equivalent to PHP hash_hmac('sha3-512', data, key, true)
 * 
 * Note: SHA3-512 uses rate (not block size) for HMAC
 * Rate for SHA3-512 = 1088 bits = 136 bytes
 * But PHP might use different block size
 */
function hmacSha3512(data: Buffer, key: Buffer): Buffer {
  // Try with rate size first (136 bytes)
  const rateSize = 136; // SHA3-512 rate = 1088 bits = 136 bytes
  const blockSize = 72; // Alternative block size
  
  // Try with rate size first
  let keyBuffer = key.length > rateSize ? Buffer.from(sha3_512.arrayBuffer(key)) : key;
  let oKeyPad = Buffer.alloc(rateSize);
  let iKeyPad = Buffer.alloc(rateSize);
  
  // Pad key to rateSize
  for (let i = 0; i < rateSize; i++) {
    if (i < keyBuffer.length) {
      oKeyPad[i] = keyBuffer[i] ^ 0x5c;
      iKeyPad[i] = keyBuffer[i] ^ 0x36;
    } else {
      oKeyPad[i] = 0x5c;
      iKeyPad[i] = 0x36;
    }
  }
  
  // Inner hash: SHA3-512(iKeyPad || data)
  const innerHash = sha3_512.arrayBuffer(Buffer.concat([iKeyPad, data]));
  
  // Outer hash: SHA3-512(oKeyPad || innerHash)
  const outerHash = sha3_512.arrayBuffer(Buffer.concat([oKeyPad, Buffer.from(innerHash)]));
  
  return Buffer.from(outerHash);
}

/**
 * Alternative HMAC-SHA3-512 with block size 72
 */
function hmacSha3512Block72(data: Buffer, key: Buffer): Buffer {
  const blockSize = 72;
  const keyBuffer = key.length > blockSize ? Buffer.from(sha3_512.arrayBuffer(key)) : key;
  const oKeyPad = Buffer.alloc(blockSize);
  const iKeyPad = Buffer.alloc(blockSize);
  
  for (let i = 0; i < blockSize; i++) {
    if (i < keyBuffer.length) {
      oKeyPad[i] = keyBuffer[i] ^ 0x5c;
      iKeyPad[i] = keyBuffer[i] ^ 0x36;
    } else {
      oKeyPad[i] = 0x5c;
      iKeyPad[i] = 0x36;
    }
  }
  
  const innerHash = sha3_512.arrayBuffer(Buffer.concat([iKeyPad, data]));
  const outerHash = sha3_512.arrayBuffer(Buffer.concat([oKeyPad, Buffer.from(innerHash)]));
  
  return Buffer.from(outerHash);
}

/**
 * Decrypt function equivalent to PHP decrypt function
 * 
 * @param pesan - Base64 encoded encrypted message
 * @param privateKey - Base64 encoded private key (contains IV, HMAC hash, and encrypted data)
 * @param authKey - Base64 encoded auth key
 * @returns Decrypted data (idagen) or null if decryption fails
 */
export function decrypt(
  pesan: string,
  privateKey: string,
  authKey: string
): string | null {
  try {
    const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    // Step 1: Decode base64 messages
    const decodedPesan = Buffer.from(pesan, 'base64');
    const decodedAuthKey = Buffer.from(authKey, 'base64');
    
    // PHP: $decode64sha512 = base64_decode(hash('sha512', $decode64));
    // 
    // Analysis of PHP code:
    // - hash('sha512', $decode64) returns HEX STRING (128 characters)
    // - base64_decode() on hex string doesn't make mathematical sense
    // 
    // Most likely the PHP code should be:
    // $decode64sha512 = hash('sha512', $decode64, TRUE); // returns binary (64 bytes)
    // 
    // But let's try the literal interpretation first:
    // 1. hash('sha512', $decode64) = hex string
    // 2. Try to decode hex string as base64 (will likely fail or produce wrong data)
    // 
    // We'll try both: binary hash (correct) and literal interpretation (fallback)
    const hexHash = crypto.createHash('sha512').update(decodedAuthKey).digest('hex');
    let decodedAuthKeySha512 = crypto
      .createHash('sha512')
      .update(decodedAuthKey)
      .digest(); // Binary (64 bytes) - most likely correct
    
    // Try literal interpretation: base64_decode(hex_string)
    let decodedAuthKeySha512Literal: Buffer | null = null;
    try {
      decodedAuthKeySha512Literal = Buffer.from(hexHash, 'base64');
    } catch (e) {
      // Will likely fail, but that's okay
    }
    
    const decodedPrivateKey = Buffer.from(privateKey, 'base64');

    if (shouldLog) {
      console.log('[Decrypt] Decoded auth key length:', decodedAuthKey.length);
      console.log('[Decrypt] Decoded auth key SHA512 length:', decodedAuthKeySha512.length);
      console.log('[Decrypt] Decoded private key length:', decodedPrivateKey.length);
    }

    // Step 2: Extract IV, HMAC hash, and encrypted data from privateKey
    const method = 'aes-256-cbc';
    const ivLength = crypto.getCipherInfo(method)?.ivLength || 16;
    const iv = decodedPrivateKey.subarray(0, ivLength);
    const hashHmac = decodedPrivateKey.subarray(ivLength, ivLength + 64);
    const opensslEnc = decodedPrivateKey.subarray(ivLength + 64);

    if (shouldLog) {
      console.log('[Decrypt] IV length:', iv.length);
      console.log('[Decrypt] HMAC hash length:', hashHmac.length);
      console.log('[Decrypt] Encrypted data length:', opensslEnc.length);
    }

    // Step 3: Decrypt using AES-256-CBC
    const decipher = crypto.createDecipheriv(method, decodedAuthKey, iv);
    let decryptedData = decipher.update(opensslEnc);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);

    if (shouldLog) {
      console.log('[Decrypt] Decrypted data length:', decryptedData.length);
    }

    // Step 4: Verify HMAC using SHA3-512
    // PHP: hash_hmac('sha3-512', $opensslenc, $decode64sha512, TRUE)
    // Try with rate size (136 bytes) first
    let hashHmacNew = hmacSha3512(opensslEnc, decodedAuthKeySha512);
    
    // If that doesn't work, try with block size 72
    let hashHmacNewAlt = hmacSha3512Block72(opensslEnc, decodedAuthKeySha512);

    if (shouldLog) {
      console.log('[Decrypt] Expected HMAC (first 16 bytes):', hashHmac.subarray(0, 16).toString('hex'));
      console.log('[Decrypt] Calculated HMAC (first 16 bytes):', hashHmacNew.subarray(0, 16).toString('hex'));
      console.log('[Decrypt] HMAC lengths match:', hashHmac.length === hashHmacNew.length);
      console.log('[Decrypt] Key for HMAC (first 16 bytes):', decodedAuthKeySha512.subarray(0, 16).toString('hex'));
    }

    // Try with block size 72 if rate size doesn't work
    if (!crypto.timingSafeEqual(hashHmac, hashHmacNew)) {
      if (shouldLog) {
        console.log('[Decrypt] HMAC mismatch with rate size (136). Trying block size 72...');
      }
      if (crypto.timingSafeEqual(hashHmac, hashHmacNewAlt)) {
        if (shouldLog) {
          console.log('[Decrypt] ✅ HMAC verified with block size 72');
        }
        hashHmacNew = hashHmacNewAlt;
      } else {
        // Try alternative: Interpret PHP code literally: base64_decode(hash('sha512', ...))
        // hash('sha512', $decode64) = hex string, try to decode as base64
        if (shouldLog) {
          console.log('[Decrypt] Trying literal PHP interpretation: base64_decode(hash("sha512", ...))');
          console.log('[Decrypt] Hex hash length:', hexHash.length);
        }
        try {
          // Try to decode hex string as base64 (weird but let's try)
          // This will likely produce invalid data, but let's see
          const decodedFromHex = Buffer.from(hexHash, 'base64');
          if (shouldLog) {
            console.log('[Decrypt] Decoded from hex (base64) length:', decodedFromHex.length);
            console.log('[Decrypt] Decoded from hex (first 16 bytes):', decodedFromHex.subarray(0, 16).toString('hex'));
          }
          const hashHmacAlt2 = hmacSha3512(opensslEnc, decodedFromHex);
          const hashHmacAlt2b = hmacSha3512Block72(opensslEnc, decodedFromHex);
          
          if (crypto.timingSafeEqual(hashHmac, hashHmacAlt2)) {
            if (shouldLog) {
              console.log('[Decrypt] ✅ HMAC verified with literal PHP interpretation (rate 136)');
            }
            hashHmacNew = hashHmacAlt2;
          } else if (crypto.timingSafeEqual(hashHmac, hashHmacAlt2b)) {
            if (shouldLog) {
              console.log('[Decrypt] ✅ HMAC verified with literal PHP interpretation (block 72)');
            }
            hashHmacNew = hashHmacAlt2b;
          } else {
            // Try using hex string directly as key (truncate to 64 bytes if needed)
            if (shouldLog) {
              console.log('[Decrypt] Trying hex string as key...');
            }
            const hexKeyBuffer = Buffer.from(hexHash, 'utf8').subarray(0, 64); // Use first 64 bytes
            const hashHmacAlt3 = hmacSha3512(opensslEnc, hexKeyBuffer);
            const hashHmacAlt3b = hmacSha3512Block72(opensslEnc, hexKeyBuffer);
            
            if (crypto.timingSafeEqual(hashHmac, hashHmacAlt3)) {
              if (shouldLog) {
                console.log('[Decrypt] ✅ HMAC verified with hex string key (rate 136)');
              }
              hashHmacNew = hashHmacAlt3;
            } else if (crypto.timingSafeEqual(hashHmac, hashHmacAlt3b)) {
              if (shouldLog) {
                console.log('[Decrypt] ✅ HMAC verified with hex string key (block 72)');
              }
              hashHmacNew = hashHmacAlt3b;
            } else {
              // Try raw key as last resort
              if (shouldLog) {
                console.log('[Decrypt] Trying raw key as last resort...');
              }
              const hashHmacAlt1 = hmacSha3512(opensslEnc, decodedAuthKey);
              const hashHmacAlt1b = hmacSha3512Block72(opensslEnc, decodedAuthKey);
              
              if (crypto.timingSafeEqual(hashHmac, hashHmacAlt1)) {
                if (shouldLog) {
                  console.log('[Decrypt] ✅ HMAC verified with raw key (rate 136)');
                }
                hashHmacNew = hashHmacAlt1;
              } else if (crypto.timingSafeEqual(hashHmac, hashHmacAlt1b)) {
                if (shouldLog) {
                  console.log('[Decrypt] ✅ HMAC verified with raw key (block 72)');
                }
                hashHmacNew = hashHmacAlt1b;
              } else {
                console.error('[Decrypt] HMAC verification failed with all methods');
                if (shouldLog) {
                  console.error('[Decrypt] Expected HMAC:', hashHmac.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (SHA512 binary, rate 136):', hashHmacNew.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (SHA512 binary, block 72):', hashHmacNewAlt.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (hex->base64, rate 136):', hashHmacAlt2.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (hex->base64, block 72):', hashHmacAlt2b.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (hex string, rate 136):', hashHmacAlt3.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (hex string, block 72):', hashHmacAlt3b.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (raw key, rate 136):', hashHmacAlt1.toString('hex'));
                  console.error('[Decrypt] Calculated HMAC (raw key, block 72):', hashHmacAlt1b.toString('hex'));
                }
                return null;
              }
            }
          }
        } catch (e) {
          console.error('[Decrypt] HMAC verification failed');
          if (shouldLog) {
            console.error('[Decrypt] Error trying literal PHP interpretation:', e);
            console.error('[Decrypt] Expected HMAC:', hashHmac.toString('hex'));
            console.error('[Decrypt] Calculated HMAC (SHA512 binary, rate 136):', hashHmacNew.toString('hex'));
            console.error('[Decrypt] Calculated HMAC (SHA512 binary, block 72):', hashHmacNewAlt.toString('hex'));
          }
          return null;
        }
      }
    }

    // Step 5: RSA private decrypt with PKCS1 OAEP padding
    // decryptedData contains the RSA private key in PEM format
    const rsaDecrypted = crypto.privateDecrypt(
      {
        key: decryptedData.toString('utf8'),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      decodedPesan
    );

    return rsaDecrypted.toString('utf8');
  } catch (error) {
    console.error('[Decrypt] Error during decryption:', error);
    return null;
  }
}

/**
 * Extract idagen from decrypted JSON data
 * Decrypted data is JSON string containing idagen or idmember field
 * 
 * @param decryptedData - Decrypted JSON data string
 * @returns idagen string or null
 */
export function extractIdAgen(decryptedData: string): string | null {
  try {
    const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    // Parse JSON data
    const parsed = JSON.parse(decryptedData);
    
    if (shouldLog) {
      console.log('[ExtractIdAgen] Parsed data keys:', Object.keys(parsed));
    }
    
    // Try idagen first (original field name)
    if (parsed.idagen) {
      if (shouldLog) {
        console.log('[ExtractIdAgen] Found idagen:', parsed.idagen);
      }
      return String(parsed.idagen);
    }
    
    // Try idmember (alternative field name from PHP)
    if (parsed.idmember) {
      if (shouldLog) {
        console.log('[ExtractIdAgen] Found idmember:', parsed.idmember);
      }
      return String(parsed.idmember);
    }
    
    // If neither found, return null
    if (shouldLog) {
      console.log('[ExtractIdAgen] Neither idagen nor idmember found in parsed data');
    }
    return null;
  } catch (error) {
    console.error('[ExtractIdAgen] Error parsing JSON:', error);
    return null;
  }
}

/**
 * Extract full decrypted data (for token validation, etc.)
 * 
 * @param decryptedData - Decrypted JSON data string
 * @returns Parsed data object or null
 */
export function extractDecryptedData(decryptedData: string): any | null {
  try {
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('[ExtractDecryptedData] Error parsing JSON:', error);
    return null;
  }
}

