# Solusi: Token Injection via JavaScript Interface (RECOMMENDED)

## Masalah
Cookie tidak reliable di Android WebView, terutama untuk cross-request persistence. Token tidak terkirim ke API routes.

## Solusi: Inject Token ke Window Object

Android app dapat inject token langsung ke JavaScript context menggunakan `evaluateJavascript()`.

### Android Code (RECOMMENDED SOLUTION)

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
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                
                // CRITICAL: Inject token to window object after page loads
                // This makes token available to JavaScript immediately
                String jsCode = String.format(
                    "window.__AUTH_TOKEN__ = %s;",
                    new Gson().toJson(authToken) // Properly escape JSON
                );
                view.evaluateJavascript(jsCode, null);
                
                // Also inject via AndroidApp interface for fallback
                injectTokenViaInterface();
            }
        });
        
        // Add JavaScript Interface as fallback
        webView.addJavascriptInterface(new WebAppInterface(authToken), "AndroidApp");
        
        // Load URL with Authorization header (for middleware to capture)
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", authToken);
        webView.loadUrl("https://deposit-otomax.vercel.app/vabank", headers);
    }
    
    private void injectTokenViaInterface() {
        String jsCode = 
            "if (typeof AndroidApp !== 'undefined') {" +
            "  window.__AUTH_TOKEN__ = AndroidApp.getAuthToken();" +
            "}";
        webView.evaluateJavascript(jsCode, null);
    }
    
    // JavaScript Interface Class
    public class WebAppInterface {
        private String token;
        
        WebAppInterface(String token) {
            this.token = token;
        }
        
        @JavascriptInterface
        public String getAuthToken() {
            return token;
        }
    }
}
```

### Simplified Version (Easier)

Jika menggunakan Gson terlalu kompleks, gunakan versi sederhana ini:

```java
webView.setWebViewClient(new WebViewClient() {
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        
        // Simple token injection (escape quotes)
        String token = "ENC Key=YOUR_TOKEN_HERE";
        String escapedToken = token.replace("'", "\\'").replace("\"", "\\\"");
        String jsCode = "window.__AUTH_TOKEN__ = '" + escapedToken + "';";
        view.evaluateJavascript(jsCode, null);
    }
});
```

## Web App Support

Web app sudah di-update untuk membaca token dari:
1. `window.__AUTH_TOKEN__` (injected by Android)
2. `AndroidApp.getAuthToken()` (JavaScript Interface)
3. URL parameter `?token=...`
4. Cookie (fallback)
5. API endpoint (fallback)

## Testing

1. **Check Token di Browser Console:**
```javascript
console.log(window.__AUTH_TOKEN__);
```

2. **Check Token saat Submit:**
- Enable logging: Set `NEXT_PUBLIC_ENABLE_AUTH_LOGGING=true`
- Check console logs saat submit form
- Harus muncul: `[DepositForm] ✅ Token dari window object (injected by Android)`

## Advantages

✅ **Reliable**: Tidak tergantung pada cookie  
✅ **Simple**: Hanya perlu inject ke window object  
✅ **Fast**: Token langsung tersedia setelah page load  
✅ **Secure**: Token hanya di memory, tidak di cookie  
✅ **Works Everywhere**: Tidak ada masalah cross-domain

## Implementation Status

- ✅ Web app sudah support window object injection
- ✅ Multiple fallback mechanisms
- ✅ Comprehensive logging untuk debugging
- ⏳ Android app perlu di-update untuk inject token

