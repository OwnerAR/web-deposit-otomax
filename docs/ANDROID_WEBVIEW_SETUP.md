# Android WebView Setup Guide

## Overview

Dokumen ini menjelaskan bagaimana aplikasi Android harus dikonfigurasi untuk memastikan cookie dan authentication bekerja dengan baik di WebView.

## Requirements untuk Aplikasi Android

### 1. Enable Cookie Support

Aplikasi Android **HARUS** mengaktifkan cookie support di WebView:

```java
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.os.Build;

public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        setupWebView();
    }
    
    private void setupWebView() {
        // CRITICAL: Enable CookieManager
        CookieManager cookieManager = CookieManager.getInstance();
        
        // Accept cookies (REQUIRED)
        cookieManager.setAcceptCookie(true);
        
        // Enable third-party cookies if needed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
        
        // Configure WebSettings
        WebSettings webSettings = webView.getSettings();
        
        // Enable JavaScript (REQUIRED for React/Next.js)
        webSettings.setJavaScriptEnabled(true);
        
        // Enable DOM Storage (REQUIRED for modern web apps)
        webSettings.setDomStorageEnabled(true);
        
        // Enable database storage
        webSettings.setDatabaseEnabled(true);
        
        // Set User Agent (optional, but recommended)
        String userAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(userAgent + " AndroidApp/1.0");
        
        // Load URL with Authorization header
        loadWebView();
    }
    
    private void loadWebView() {
        String url = "https://deposit-otomax.vercel.app/vabank";
        String authToken = "ENC Key=YOUR_TOKEN_HERE"; // Token dari aplikasi
        
        // Create WebViewClient to handle cookie sync
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false; // Let WebView handle the URL
            }
            
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                // Add Authorization header when page starts
                // Note: This is done via WebViewClient or by setting header in loadUrl
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // CRITICAL: Flush cookies to persist them
                CookieManager.getInstance().flush();
            }
        });
        
        // Load URL with Authorization header
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", authToken);
        webView.loadUrl(url, headers);
    }
}
```

### 2. Cookie Flush (CRITICAL)

Setelah halaman dimuat atau setelah request penting, **WAJIB** memanggil `flush()`:

```java
// After page load
webView.setWebViewClient(new WebViewClient() {
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        CookieManager.getInstance().flush(); // ✅ CRITICAL: Persist cookies
    }
});

// After important actions (e.g., login, form submit)
CookieManager.getInstance().flush();
```

### 3. WebViewClient Configuration

```java
webView.setWebViewClient(new WebViewClient() {
    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        // Handle errors
    }
    
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // Sync cookies after page load
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().flush();
        }
    }
});
```

### 4. Load URL dengan Authorization Header

```java
String url = "https://deposit-otomax.vercel.app/vabank";
String authToken = "ENC Key=YOUR_TOKEN_HERE";

// Method 1: Using loadUrl with headers (API 21+)
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
    Map<String, String> headers = new HashMap<>();
    headers.put("Authorization", authToken);
    webView.loadUrl(url, headers);
} else {
    // Method 2: For older Android versions, use WebViewClient
    webView.loadUrl(url);
    // Header will be added via WebViewClient or intercepting requests
}
```

## Cookie Flow di WebView

### Request Flow:

```
1. Android App → WebView.loadUrl(url, headers)
   Headers: { Authorization: "ENC Key=..." }
   ↓
2. WebView → Server (dengan Authorization header)
   ↓
3. Server Middleware → Tangkap header, simpan ke cookie
   Set-Cookie: auth_token=ENC Key=...; HttpOnly; Secure; SameSite=Lax
   Set-Cookie: auth_token_client=ENC Key=...; Secure; SameSite=Lax
   ↓
4. WebView CookieManager → Simpan cookie
   ↓
5. CookieManager.flush() → Persist cookie ke storage
   ↓
6. Request berikutnya → Cookie otomatis dikirim oleh WebView
```

### Response Flow:

```
1. Server → Set-Cookie header
   ↓
2. WebView CookieManager → Terima dan simpan
   ↓
3. Cookie tersedia untuk request berikutnya
```

## Troubleshooting

### Cookie Tidak Tersimpan

**Checklist:**

1. ✅ Apakah `CookieManager.setAcceptCookie(true)` sudah dipanggil?
2. ✅ Apakah `CookieManager.flush()` dipanggil setelah page load?
3. ✅ Apakah `secure: true` untuk HTTPS?
4. ✅ Apakah `path: '/'` sudah benar?

**Debug Code:**

```java
// Check cookies yang tersimpan
CookieManager cookieManager = CookieManager.getInstance();
String cookies = cookieManager.getCookie("https://deposit-otomax.vercel.app");
Log.d("WebView", "Cookies: " + cookies);

// Check if cookies are accepted
boolean acceptCookie = CookieManager.getInstance().acceptCookie();
Log.d("WebView", "Accept Cookie: " + acceptCookie);
```

### Cookie Tidak Terkirim ke API Routes

**Solusi:**

1. Pastikan `credentials: 'include'` di fetch requests (sudah di implementasi)
2. Pastikan `path: '/'` di cookie settings (sudah di implementasi)
3. Pastikan `sameSite: 'lax'` (sudah di implementasi)

### Authorization Header Tidak Terkirim

**Solusi:**

Gunakan `loadUrl(url, headers)` dengan Authorization header:

```java
Map<String, String> headers = new HashMap<>();
headers.put("Authorization", "ENC Key=YOUR_TOKEN");
webView.loadUrl(url, headers);
```

## Best Practices

### 1. Initialize CookieManager Early

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Initialize CookieManager BEFORE creating WebView
    CookieManager.getInstance().setAcceptCookie(true);
    
    // ... rest of setup
}
```

### 2. Handle Cookie Sync

```java
// Sync cookies after important events
private void syncCookies() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        CookieManager.getInstance().flush();
    }
}

// Call after:
// - Page load finished
// - Form submission
// - Authentication events
```

### 3. Clear Cookies (jika perlu logout)

```java
private void clearCookies() {
    CookieManager cookieManager = CookieManager.getInstance();
    cookieManager.removeAllCookies(new ValueCallback<Boolean>() {
        @Override
        public void onReceiveValue(Boolean value) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                cookieManager.flush();
            }
        }
    });
}
```

### 4. Handle WebView Lifecycle

```java
@Override
protected void onResume() {
    super.onResume();
    webView.onResume();
    // Sync cookies when app resumes
    syncCookies();
}

@Override
protected void onPause() {
    super.onPause();
    webView.onPause();
    // Sync cookies before pausing
    syncCookies();
}

@Override
protected void onDestroy() {
    super.onDestroy();
    webView.destroy();
}
```

## Testing

### Test Cookie Storage:

```java
// After loading page, check cookies
webView.setWebViewClient(new WebViewClient() {
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        
        // Check cookies
        CookieManager cookieManager = CookieManager.getInstance();
        String cookies = cookieManager.getCookie(url);
        Log.d("WebView", "Cookies after load: " + cookies);
        
        // Should contain: auth_token and auth_token_client
    }
});
```

### Test Cookie Persistence:

1. Load page dengan Authorization header
2. Check cookies setelah page load
3. Navigate to another page
4. Check cookies masih ada
5. Reload page
6. Check cookies masih ada

## Referensi

- [Android CookieManager Documentation](https://developer.android.com/reference/android/webkit/CookieManager)
- [WebView Cookie Handling](https://developer.android.com/guide/webapps/webview#cookies)
- [WebView Best Practices](https://developer.android.com/guide/webapps/best-practices)

