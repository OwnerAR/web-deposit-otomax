# Solusi: Token via URL Query Parameter

## Overview

Solusi paling sederhana dan reliable untuk pass token dari Android WebView ke web app adalah melalui URL query parameter. Ini tidak memerlukan modifikasi kode Android yang kompleks.

## Format URL

Android app hanya perlu append token ke URL sebagai query parameter:

```
https://deposit-otomax.vercel.app/vabank?token=ENC Key=YOUR_TOKEN_HERE
```

atau dengan parameter name yang berbeda:

```
https://deposit-otomax.vercel.app/vabank?auth_token=ENC Key=YOUR_TOKEN_HERE
https://deposit-otomax.vercel.app/vabank?authToken=ENC Key=YOUR_TOKEN_HERE
```

## Android Implementation

### Simple Version (Recommended)

Android app hanya perlu construct URL dengan token:

```java
String baseUrl = "https://deposit-otomax.vercel.app/vabank";
String authToken = "ENC Key=YOUR_TOKEN_HERE";

// URL encode token untuk safety
String encodedToken = URLEncoder.encode(authToken, "UTF-8");
String urlWithToken = baseUrl + "?token=" + encodedToken;

// Load URL
webView.loadUrl(urlWithToken);
```

### Complete Example

```java
public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    private String authToken = "ENC Key=YOUR_TOKEN_HERE";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        setupWebView();
    }
    
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        
        // Construct URL with token as query parameter
        String baseUrl = "https://deposit-otomax.vercel.app/vabank";
        String urlWithToken;
        
        try {
            // URL encode token untuk handle special characters
            String encodedToken = URLEncoder.encode(authToken, "UTF-8");
            urlWithToken = baseUrl + "?token=" + encodedToken;
        } catch (UnsupportedEncodingException e) {
            // Fallback: use token as-is
            urlWithToken = baseUrl + "?token=" + authToken;
        }
        
        // Load URL
        webView.loadUrl(urlWithToken);
    }
}
```

## Web App Implementation

Web app sudah support membaca token dari URL parameter dengan priority tertinggi:

### Priority Order:

1. **URL Query Parameter** (`?token=...` atau `?auth_token=...`) - **PRIORITY 1**
2. AuthContext (response header dari middleware)
3. Cookie (non-httpOnly)
4. API endpoint (httpOnly cookie)

### How It Works:

```typescript
// DepositForm.tsx
const getAuthToken = async (): Promise<string | null> => {
  // PRIORITY 1: Read from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token') || 
                       urlParams.get('auth_token') || 
                       urlParams.get('authToken');
  
  if (tokenFromUrl) {
    return tokenFromUrl; // ✅ Token ditemukan!
  }
  
  // ... fallback methods
};
```

## Advantages

✅ **Simple**: Android hanya perlu append token ke URL  
✅ **Reliable**: Tidak tergantung pada cookie atau WebView features  
✅ **Works Everywhere**: Compatible dengan semua WebView versions  
✅ **No Code Changes Needed**: Android hanya perlu construct URL  
✅ **Secure**: Token hanya di URL saat initial load, kemudian di-inject ke body

## Security Considerations

### 1. URL Encoding

Pastikan Android app URL-encode token untuk handle special characters:

```java
String encodedToken = URLEncoder.encode(authToken, "UTF-8");
```

### 2. HTTPS Only

Pastikan web app hanya diakses via HTTPS untuk protect token di transit.

### 3. Token Not Visible in UI

Token dari URL parameter langsung di-extract dan di-inject ke request body, tidak ditampilkan di UI.

### 4. Clear URL After Extract

Setelah token di-extract, URL bisa di-clean (optional):

```typescript
// Remove token from URL after extraction (optional)
if (tokenFromUrl) {
  const newUrl = window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}
```

## Testing

### 1. Test URL Construction

```java
// Android
String token = "ENC Key=TEST_TOKEN";
String url = "https://deposit-otomax.vercel.app/vabank?token=" + 
             URLEncoder.encode(token, "UTF-8");
System.out.println(url);
```

### 2. Test Web App

Buka browser dengan URL:
```
https://deposit-otomax.vercel.app/vabank?token=ENC Key=TEST_TOKEN
```

Check console logs:
- `[DepositForm] ✅ Token dari URL query parameter (PRIORITY 1): ENC Key=...`

### 3. Test Form Submit

1. Load page dengan `?token=...`
2. Fill form
3. Submit
4. Check API request body - harus ada `auth_token`

## Implementation Status

✅ Web app sudah support URL parameter dengan priority tertinggi  
✅ Multiple parameter names support: `token`, `auth_token`, `authToken`  
✅ URL encoding handling  
✅ Comprehensive logging untuk debugging  
⏳ Android app perlu di-update untuk pass token via URL

## Alternative Parameter Names

Web app support multiple parameter names untuk flexibility:

- `?token=...` (primary)
- `?auth_token=...` (alternative)
- `?authToken=...` (camelCase)

Android bisa menggunakan salah satu yang paling convenient.

## Example URLs

```
https://deposit-otomax.vercel.app/vabank?token=ENC Key=ABC123
https://deposit-otomax.vercel.app/ewallet?token=ENC Key=XYZ789
https://deposit-otomax.vercel.app/qris?auth_token=ENC Key=DEF456
```

## Troubleshooting

### Token Not Found

1. Check URL format: `?token=...` harus ada
2. Check URL encoding: Pastikan special characters di-encode
3. Enable logging: Set `NEXT_PUBLIC_ENABLE_AUTH_LOGGING=true`
4. Check console: Harus ada log `[DepositForm] ✅ Token dari URL query parameter`

### Token Not Working

1. Check token format: Harus exact match dengan yang diharapkan backend
2. Check request body: Token harus ada di `auth_token` field
3. Check API logs: Token harus terkirim ke backend

## Next Steps

1. ✅ Web app sudah ready untuk menerima token via URL
2. ⏳ Inform ke Android team untuk pass token via URL parameter
3. ⏳ Test dengan real token dari Android app

