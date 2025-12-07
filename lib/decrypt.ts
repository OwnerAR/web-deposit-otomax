import crypto from 'crypto';
import { sha3_512 } from 'js-sha3';

/**
 * HMAC-SHA3-512 implementation with block size 72
 * Equivalent to PHP hash_hmac('sha3-512', data, key, true)
 */
function hmacSha3512(data: Buffer, key: Buffer): Buffer {
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
 * PHP code: $decode64sha512 = base64_decode(hash('sha512', $decode64));
 * This means: hash('sha512', $decode64) returns hex string, then decode as base64
 * 
 * @param pesan - Base64 encoded encrypted message
 * @param privateKey - Base64 encoded private key (contains IV, HMAC hash, and encrypted data)
 * @param authKey - Base64 encoded auth key
 * @returns Decrypted data string or null if decryption fails
 */
export function decrypt(
  pesan: string,
  privateKey: string,
  authKey: string
): string | null {
  try {
    // Step 1: Decode base64 messages
    const decodedPesan = Buffer.from(pesan, 'base64');
    const decodedAuthKey = Buffer.from(authKey, 'base64');
    const decodedPrivateKey = Buffer.from(privateKey, 'base64');

    // Step 2: Calculate SHA512 hash and decode as base64 (literal PHP interpretation)
    // PHP: $decode64sha512 = base64_decode(hash('sha512', $decode64));
    const hexHash = crypto.createHash('sha512').update(decodedAuthKey).digest('hex');
    const decodedAuthKeySha512 = Buffer.from(hexHash, 'base64');

    // Step 3: Extract IV, HMAC hash, and encrypted data from privateKey
    const method = 'aes-256-cbc';
    const ivLength = crypto.getCipherInfo(method)?.ivLength || 16;
    const iv = decodedPrivateKey.subarray(0, ivLength);
    const hashHmac = decodedPrivateKey.subarray(ivLength, ivLength + 64);
    const opensslEnc = decodedPrivateKey.subarray(ivLength + 64);

    // Step 4: Decrypt using AES-256-CBC
    const decipher = crypto.createDecipheriv(method, decodedAuthKey, iv);
    let decryptedData = decipher.update(opensslEnc);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);

    // Step 5: Verify HMAC using SHA3-512
    // PHP: hash_hmac('sha3-512', $opensslenc, $decode64sha512, TRUE)
    const hashHmacNew = hmacSha3512(opensslEnc, decodedAuthKeySha512);

    if (!crypto.timingSafeEqual(hashHmac, hashHmacNew)) {
      console.error('[Decrypt] HMAC verification failed');
      return null;
    }

    // Step 6: RSA private decrypt with PKCS1 OAEP padding
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
 * Supports both idagen and idmember fields
 * 
 * @param decryptedData - Decrypted JSON data string
 * @returns idagen/idmember string or null
 */
export function extractIdAgen(decryptedData: string): string | null {
  try {
    const parsed = JSON.parse(decryptedData);
    
    // Try idmember first (from PHP), then idagen (fallback)
    if (parsed.idmember) {
      return String(parsed.idmember);
    }
    
    if (parsed.idagen) {
      return String(parsed.idagen);
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
