# Android WebView Integration Guide

## Overview

Aplikasi web ini dirancang untuk diintegrasikan dengan Android WebView yang mengirimkan Authorization header untuk autentikasi.

## Strategi Implementasi

### 1. Next.js API Route sebagai Proxy (Recommended)

**Cara Kerja:**
- Android WebView mengirim Authorization header saat membuka web
- Next.js API route (`/app/api/deposit/create/route.ts`) membaca header tersebut
- API route meneruskan request ke backend dengan Authorization header

**Keuntungan:**
- ✅ Aman: Token tidak terlihat di client-side JavaScript
- ✅ Fleksibel: Bisa handle berbagai metode autentikasi
- ✅ Tidak perlu modifikasi backend

### 2. Fallback: Token via URL Parameter atau PostMessage

**Cara Kerja:**
- Android bisa mengirim token via URL parameter: `?token=xxx` atau `?auth_token=xxx`
- Atau via postMessage JavaScript interface
- Token disimpan di sessionStorage untuk request selanjutnya

**Keuntungan:**
- ✅ Alternatif jika header tidak bisa diakses langsung
- ✅ Mudah diimplementasikan

## Implementasi di Android

### Opsi 1: Menggunakan Authorization Header (Recommended)

```kotlin
val webView = findViewById<WebView>(R.id.webView)
val webSettings = webView.settings
webSettings.javaScriptEnabled = true

// Set Authorization header
val url = "https://your-domain.com"
val headers = mapOf(
    "Authorization" to "Bearer YOUR_TOKEN_HERE"
)

webView.loadUrl(url, headers)
```

### Opsi 2: Mengirim Token via URL Parameter

```kotlin
val token = "YOUR_TOKEN_HERE"
val url = "https://your-domain.com?token=$token"
webView.loadUrl(url)
```

### Opsi 3: Mengirim Token via PostMessage

```kotlin
// Setup JavaScript interface
webView.addJavascriptInterface(object {
    @JavascriptInterface
    fun sendAuthToken(token: String) {
        // Send token via postMessage
        webView.evaluateJavascript(
            "window.postMessage({type: 'AUTH_TOKEN', token: '$token'}, '*');",
            null
        )
    }
}, "AndroidBridge")

// Call after page loads
webView.webViewClient = object : WebViewClient() {
    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        // Send token after page loads
        sendAuthToken("YOUR_TOKEN_HERE")
    }
}
```

## Flow Diagram

### Skenario 1: Authorization Header (Recommended)

```
┌─────────────────┐
│  Android App    │
│  (WebView)      │
└────────┬────────┘
         │
         │ 1. Load URL dengan Authorization header
         │    webView.loadUrl(url, headers)
         ▼
┌─────────────────┐
│  Next.js        │
│  Middleware     │
└────────┬────────┘
         │
         │ 2. Capture Authorization header
         │    Simpan di httpOnly cookie
         ▼
┌─────────────────┐
│  Next.js Web    │
│  (Client)       │
└────────┬────────┘
         │
         │ 3. Submit form deposit
         │    (apiClient.createDeposit)
         ▼
┌─────────────────┐
│  Next.js API    │
│  Route Proxy    │
│  /api/deposit/  │
│  create         │
└────────┬────────┘
         │
         │ 4. Baca token dari cookie
         │    Forward ke backend dengan
         │    Authorization header
         ▼
┌─────────────────┐
│  Backend API    │
│  (Xendit)       │
└─────────────────┘
```

### Skenario 2: Token via URL/PostMessage (Fallback)

```
┌─────────────────┐
│  Android App    │
│  (WebView)      │
└────────┬────────┘
         │
         │ 1. Load URL dengan token parameter
         │    atau kirim via postMessage
         ▼
┌─────────────────┐
│  Next.js Web    │
│  (Client)       │
└────────┬────────┘
         │
         │ 2. Extract token dari URL/postMessage
         │    Simpan di sessionStorage
         │
         │ 3. Submit form deposit
         │    (apiClient.createDeposit)
         ▼
┌─────────────────┐
│  Next.js API    │
│  Route Proxy    │
│  /api/deposit/  │
│  create         │
└────────┬────────┘
         │
         │ 4. Baca token dari request header
         │    (dikirim dari client)
         │    Forward ke backend
         ▼
┌─────────────────┐
│  Backend API    │
│  (Xendit)       │
└─────────────────┘
```

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   └── set-token/
│   │       └── route.ts          # API endpoint untuk set token (optional)
│   └── deposit/
│       └── create/
│           └── route.ts          # API route proxy
components/
├── auth/
│   └── AuthProvider.tsx          # Auth setup component
lib/
├── api.ts                        # Updated to use proxy
└── auth.ts                       # Auth utility functions
middleware.ts                     # Middleware untuk capture Authorization header
```

## Testing

### Test dengan Authorization Header (Recommended)

**1. Test Middleware (Initial Page Load)**
```bash
# Simulasi Android WebView dengan Authorization header
curl -X GET http://localhost:3000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v

# Check cookie di response headers
# Set-Cookie: auth_token=YOUR_TOKEN; HttpOnly; ...
```

**2. Test API Route (Form Submit)**
```bash
# Test API route dengan cookie (setelah middleware)
curl -X POST http://localhost:3000/api/deposit/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "amount": 100000,
    "payment_method": "VA_BANK"
  }'

# Atau dengan Authorization header langsung
curl -X POST http://localhost:3000/api/deposit/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100000,
    "payment_method": "VA_BANK"
  }'
```

### Test dengan URL Parameter (Fallback)

Buka browser:
```
http://localhost:3000?token=YOUR_TOKEN
```

Token akan disimpan di sessionStorage dan dikirim sebagai header saat submit form.

## Security Considerations

1. **HTTPS Only**: Pastikan menggunakan HTTPS di production
2. **Token Validation**: Backend harus memvalidasi token
3. **CORS**: Konfigurasi CORS di backend jika diperlukan
4. **Token Expiry**: Handle token expiry dengan proper error handling

## Troubleshooting

### Token tidak terkirim
- Pastikan Android WebView mengirim header dengan benar
- Check Network tab di browser untuk melihat request headers
- Pastikan API route membaca header dengan `request.headers.get('authorization')`

### CORS Error
- Jika direct call ke backend, pastikan backend mengizinkan origin WebView
- Gunakan Next.js API route sebagai proxy untuk menghindari CORS

### Token di URL terlihat di logs
- Gunakan metode header untuk keamanan lebih baik
- Jangan log URL dengan token di production

