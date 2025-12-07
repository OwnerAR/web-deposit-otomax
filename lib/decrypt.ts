import crypto from 'crypto';
import { sha3_512 } from 'js-sha3';

/**
 * HMAC-SHA3-512 implementation
 * Equivalent to PHP hash_hmac('sha3-512', data, key, true)
 */
function hmacSha3512(data: Buffer, key: Buffer): Buffer {
  const blockSize = 72; // SHA3-512 block size
  const keyBuffer = key.length > blockSize ? Buffer.from(sha3_512.arrayBuffer(key)) : key;
  const oKeyPad = Buffer.alloc(blockSize);
  const iKeyPad = Buffer.alloc(blockSize);
  
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBuffer[i] ? keyBuffer[i] ^ 0x5c : 0x5c;
    iKeyPad[i] = keyBuffer[i] ? keyBuffer[i] ^ 0x36 : 0x36;
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
    // Step 1: Decode base64 messages
    const decodedPesan = Buffer.from(pesan, 'base64');
    const decodedAuthKey = Buffer.from(authKey, 'base64');
    const decodedAuthKeySha512 = crypto
      .createHash('sha512')
      .update(decodedAuthKey)
      .digest();
    const decodedPrivateKey = Buffer.from(privateKey, 'base64');

    // Step 2: Extract IV, HMAC hash, and encrypted data from privateKey
    const method = 'aes-256-cbc';
    const ivLength = crypto.getCipherInfo(method)?.ivLength || 16;
    const iv = decodedPrivateKey.subarray(0, ivLength);
    const hashHmac = decodedPrivateKey.subarray(ivLength, ivLength + 64);
    const opensslEnc = decodedPrivateKey.subarray(ivLength + 64);

    // Step 3: Decrypt using AES-256-CBC
    const decipher = crypto.createDecipheriv(method, decodedAuthKey, iv);
    let decryptedData = decipher.update(opensslEnc);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);

    // Step 4: Verify HMAC using SHA3-512
    // PHP: hash_hmac('sha3-512', $opensslenc, $decode64sha512, TRUE)
    const hashHmacNew = hmacSha3512(opensslEnc, decodedAuthKeySha512);

    if (!crypto.timingSafeEqual(hashHmac, hashHmacNew)) {
      console.error('[Decrypt] HMAC verification failed');
      return null;
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
 * Decrypted data is JSON string containing idagen field
 * 
 * @param decryptedData - Decrypted JSON data string
 * @returns idagen string or null
 */
export function extractIdAgen(decryptedData: string): string | null {
  try {
    // Parse JSON data
    const parsed = JSON.parse(decryptedData);
    
    // Extract idagen from parsed data
    if (parsed.idagen) {
      return String(parsed.idagen);
    }
    
    // If idagen not found, return null
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

