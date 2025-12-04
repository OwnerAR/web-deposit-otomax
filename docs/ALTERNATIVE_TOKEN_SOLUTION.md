# Solusi Alternatif: Token Injection via JavaScript Interface

## Masalah
Cookie tidak selalu reliable di Android WebView, terutama untuk cross-request persistence.

## Solusi: JavaScript Interface / Window Object Injection

Android app dapat inject token langsung ke JavaScript context menggunakan JavaScript Interface atau window object.

### Method 1: JavaScript Interface (Recommended)

#### Android Code:
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
        
        // Add JavaScript Interface
        webView.addJavascriptInterface(new WebAppInterface(authToken), "AndroidApp");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                
                // Inject token after page loads
                String jsCode = "window.__AUTH_TOKEN__ = '" + authToken + "';";
                webView.evaluateJavascript(jsCode, null);
            }
        });
        
        webView.loadUrl("https://deposit-otomax.vercel.app/vabank");
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

#### Web Code (JavaScript):
```javascript
// Read token from window object or Android interface
let authToken = null;

// Priority 1: Read from window object (injected by Android)
if (typeof window !== 'undefined' && window.__AUTH_TOKEN__) {
    authToken = window.__AUTH_TOKEN__;
}

// Priority 2: Read from Android JavaScript Interface
if (!authToken && typeof AndroidApp !== 'undefined') {
    try {
        authToken = AndroidApp.getAuthToken();
    } catch (e) {
        console.error('Failed to get token from Android:', e);
    }
}
```

### Method 2: Window Object Injection (Simpler)

#### Android Code:
```java
webView.setWebViewClient(new WebViewClient() {
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        
        // Inject token directly to window object
        String token = "ENC Key=YOUR_TOKEN_HERE";
        String jsCode = String.format(
            "window.__AUTH_TOKEN__ = '%s';",
            token.replace("'", "\\'")
        );
        view.evaluateJavascript(jsCode, null);
    }
});
```

#### Web Code:
```javascript
// Simply read from window object
const authToken = window.__AUTH_TOKEN__;
```

### Method 3: URL Parameter (Simple but less secure)

Jika cookie benar-benar tidak work, kita bisa pass token via URL parameter:

```
https://deposit-otomax.vercel.app/vabank?token=ENC Key=...
```

Kemudian web akan:
1. Extract token dari URL
2. Store di memory (tidak di cookie)
3. Gunakan untuk semua requests

## Implementasi di Web App

Saya akan update kode untuk support semua method ini sebagai fallback.

