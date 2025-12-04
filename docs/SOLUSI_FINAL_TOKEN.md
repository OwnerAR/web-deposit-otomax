# Solusi Final: Token via Query Parameter (Auto-Redirect)

## Overview

**Solusi terbaik tanpa akses kode Android**: Middleware otomatis redirect dengan query parameter saat menerima Authorization header.

## Flow

```
1. Android App → Load URL dengan Authorization header
   https://deposit-otomax.vercel.app/vabank
   Headers: { Authorization: "ENC Key=..." }
   ↓
2. Middleware → Tangkap Authorization header
   ↓
3. Middleware → Redirect ke URL yang sama dengan query parameter
   https://deposit-otomax.vercel.app/vabank?authToken="ENC Key=..."
   ↓
4. Client-side → Baca token dari URL query parameter
   ↓
5. Saat submit → Inject token ke body request
   { amount: 10000, payment_method: "VA_BANK", auth_token: "ENC Key=..." }
```

## Format URL

Setelah redirect oleh middleware, URL akan menjadi:

```
https://deposit-otomax.vercel.app/vabank?authToken="ENC Key=YOUR_TOKEN_HERE"
```

## Implementasi

### 1. Middleware (Auto-Redirect)

Middleware sudah di-update untuk:
- ✅ Tangkap Authorization header saat initial load
- ✅ Redirect otomatis ke URL yang sama dengan query parameter `?authToken="ENC Key=..."`
- ✅ Format token dengan quotes: `"ENC Key=..."`

### 2. DepositForm (Baca dari URL)

DepositForm sudah di-update untuk:
- ✅ **PRIORITY 1**: Baca dari URL query parameter (`authToken`)
- ✅ Handle token dengan quotes (remove quotes automatically)
- ✅ URL decode jika diperlukan
- ✅ Support multiple parameter names: `authToken`, `token`, `auth_token`

### 3. Token Processing

Token akan di-process:
1. Read from URL: `authToken="ENC Key=..."`
2. Decode URL encoding
3. Remove quotes: `ENC Key=...`
4. Inject ke body: `{ auth_token: "ENC Key=..." }`

## Keuntungan

✅ **Tidak perlu modify Android code** - Middleware handle redirect otomatis  
✅ **Reliable** - Token langsung ada di URL  
✅ **Simple** - Tidak perlu cookie atau storage  
✅ **Works everywhere** - Compatible dengan semua WebView versions

## Testing

### Manual Test:

1. Buka browser dengan URL:
```
https://deposit-otomax.vercel.app/vabank?authToken="ENC Key=TEST_TOKEN"
```

2. Check console logs:
```
[DepositForm] ✅ Token dari URL query parameter (PRIORITY 1): ENC Key=...
```

3. Fill form dan submit

4. Check API request body:
```json
{
  "amount": 10000,
  "payment_method": "VA_BANK",
  "auth_token": "ENC Key=TEST_TOKEN"
}
```

## Troubleshooting

### Token tidak terkirim:

1. Check URL setelah redirect - harus ada `?authToken="ENC Key=..."`
2. Check console logs - harus ada log `[DepositForm] ✅ Token dari URL query parameter`
3. Enable logging: Set `NEXT_PUBLIC_ENABLE_AUTH_LOGGING=true`

## Current Status

✅ Middleware auto-redirect dengan query parameter  
✅ DepositForm baca dari URL parameter (priority 1)  
✅ Token di-inject ke body request  
✅ Support format dengan quotes  
✅ Comprehensive logging untuk debugging

