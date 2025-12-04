# Android WebView Cookie Handling

## Overview

Aplikasi web ini dibuka di dalam Android WebView, yang memiliki karakteristik khusus dalam hal cookie handling. Dokumen ini menjelaskan bagaimana cookie disimpan dan dikirim di Android WebView.

## Masalah Cookie di Android WebView

### 1. CookieManager Configuration

Android WebView memerlukan konfigurasi khusus untuk menyimpan dan mengirim cookie:

```java
// Android Code yang harus di-set oleh aplikasi
CookieManager cookieManager = CookieManager.getInstance();
cookieManager.setAcceptCookie(true); // Enable cookie acceptance
cookieManager.setAcceptThirdPartyCookies(webView, true); // Enable third-party cookies if needed

// CRITICAL: Sync cookies to persist them
cookieManager.flush();
```

### 2. Cookie Settings yang Kompatibel dengan WebView

#### ✅ Cookie Settings yang Bekerja di WebView:

```typescript
// middleware.ts
response.cookies.set('auth_token', authHeader, {
  httpOnly: true,        // ✅ Bekerja di WebView (server-side only)
  secure: true,          // ✅ WAJIB untuk HTTPS (WebView support)
  sameSite: 'lax',       // ✅ Lax lebih kompatibel dengan WebView
  maxAge: 60 * 60 * 24,  // ✅ 24 hours
  path: '/',             // ✅ Root path untuk semua routes
});
```

#### ❌ Cookie Settings yang MUNGKIN TIDAK BEKERJA:

- `sameSite: 'strict'` → Bisa bermasalah di WebView
- `secure: false` di production → WebView mungkin menolak
- Cookie tanpa `path` → Bisa tidak terkirim ke semua routes

### 3. Non-HttpOnly Cookie untuk Client-Side Access

Karena httpOnly cookie tidak bisa dibaca oleh JavaScript, kita juga menyimpan non-httpOnly cookie:

```typescript
// middleware.ts
response.cookies.set('auth_token_client', authHeader, {
  httpOnly: false,       // ✅ Bisa dibaca oleh JavaScript
  secure: true,          // ✅ HTTPS only
  sameSite: 'lax',       // ✅ WebView compatible
  maxAge: 60 * 60 * 24,
  path: '/',
});
```

## Flow Cookie di Android WebView

### Request Flow:

```
1. Android App membuka WebView dengan Authorization header
   ↓
2. Middleware menangkap header dan menyimpan ke cookie
   ↓
3. Cookie disimpan di WebView's CookieManager
   ↓
4. Setiap request berikutnya, WebView otomatis mengirim cookie
   ↓
5. Middleware/API route bisa membaca cookie
```

### Response Flow:

```
1. Server mengirim Set-Cookie header
   ↓
2. WebView CookieManager menyimpan cookie
   ↓
3. Cookie tersedia untuk request berikutnya
```

## Masalah yang Sering Terjadi

### 1. Cookie Tidak Tersimpan

**Gejala:**
- Cookie tidak muncul di request berikutnya
- Token hilang setelah reload

**Solusi:**
- Pastikan `CookieManager.setAcceptCookie(true)` di Android
- Pastikan `secure: true` untuk HTTPS
- Pastikan `path: '/'` untuk semua routes
- Android harus call `CookieManager.flush()` setelah set cookie

### 2. Cookie Tidak Terkirim ke API Routes

**Gejala:**
- Cookie ada di initial request tapi tidak di API routes

**Solusi:**
- Pastikan `credentials: 'include'` di fetch requests
- Pastikan `path: '/'` di cookie settings
- Pastikan `sameSite: 'lax'` (lebih permissive)

### 3. HttpOnly Cookie Tidak Terbaca Client-Side

**Gejala:**
- JavaScript tidak bisa baca cookie

**Solusi:**
- Gunakan non-httpOnly cookie untuk client-side access
- Atau gunakan API endpoint untuk membaca httpOnly cookie

## Best Practices untuk WebView

### 1. Cookie Configuration

```typescript
// middleware.ts - Cookie settings optimal untuk WebView
const cookieOptions = {
  httpOnly: true,              // Server-side only (secure)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const,    // More permissive for WebView
  maxAge: 60 * 60 * 24,        // 24 hours
  path: '/',                    // Root path (all routes)
};

// Non-httpOnly untuk client-side
const clientCookieOptions = {
  ...cookieOptions,
  httpOnly: false,             // Client-side accessible
};
```

### 2. Android WebView Configuration

Aplikasi Android HARUS melakukan ini:

```java
// Android Code (harus dilakukan oleh aplikasi)
WebView webView = findViewById(R.id.webview);
WebSettings webSettings = webView.getSettings();

// Enable JavaScript
webSettings.setJavaScriptEnabled(true);

// CRITICAL: Enable and configure CookieManager
CookieManager cookieManager = CookieManager.getInstance();
cookieManager.setAcceptCookie(true);
cookieManager.setAcceptThirdPartyCookies(webView, true);

// Sync cookies to persist them
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
    cookieManager.flush();
}
```

### 3. Fallback Mechanism

Karena cookie di WebView bisa unreliable, kita punya beberapa fallback:

1. **Priority 1**: Non-httpOnly cookie (client-side readable)
2. **Priority 2**: HttpOnly cookie (via API endpoint)
3. **Priority 3**: Response header (x-auth-token)
4. **Priority 4**: URL parameter (initial load)

## Testing Cookie di WebView

### Cara Test:

1. **Check Cookie di Android:**
```java
// Android Code untuk debug
CookieManager cookieManager = CookieManager.getInstance();
String cookies = cookieManager.getCookie("https://your-domain.com");
Log.d("Cookies", cookies);
```

2. **Check Cookie di Web (JavaScript):**
```javascript
// Console browser/WebView
console.log(document.cookie);
```

3. **Check Cookie di Server:**
```typescript
// API route
console.log('All cookies:', request.cookies.getAll());
```

## Rekomendasi untuk Aplikasi Android

### 1. WebViewClient Configuration

```java
webView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        // Ensure cookies are included in requests
        return false;
    }
    
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // Sync cookies after page load
        CookieManager.getInstance().flush();
    }
});
```

### 2. Cookie Sync

```java
// Sync cookies periodically or after important actions
CookieManager.getInstance().flush();
```

### 3. Clear Cookies (jika perlu logout)

```java
CookieManager cookieManager = CookieManager.getInstance();
cookieManager.removeAllCookies(null);
cookieManager.flush();
```

## Current Implementation

Aplikasi web ini sudah mengimplementasikan:

1. ✅ Multiple cookie storage (httpOnly + non-httpOnly)
2. ✅ Cookie settings yang kompatibel dengan WebView
3. ✅ Fallback mechanisms jika cookie tidak tersedia
4. ✅ API endpoint untuk membaca httpOnly cookie
5. ✅ Response header sebagai fallback

## Troubleshooting

Jika cookie tidak bekerja:

1. **Check Android Code:**
   - Apakah `CookieManager.setAcceptCookie(true)` sudah dipanggil?
   - Apakah `CookieManager.flush()` sudah dipanggil?
   - Apakah WebView sudah enable JavaScript?

2. **Check Cookie Settings:**
   - Apakah `secure: true` untuk HTTPS?
   - Apakah `path: '/'` sudah benar?
   - Apakah `sameSite: 'lax'` sudah digunakan?

3. **Check Network Requests:**
   - Apakah cookie header terkirim di network requests?
   - Apakah Set-Cookie header diterima dari server?

4. **Use Logging:**
   - Enable `ENABLE_AUTH_LOGGING=true` untuk melihat cookie flow
   - Check server logs untuk melihat cookie yang diterima

## Referensi

- [Android CookieManager Documentation](https://developer.android.com/reference/android/webkit/CookieManager)
- [WebView Cookie Handling](https://developer.android.com/guide/webapps/webview#cookies)
- [HTTP Cookie Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)

