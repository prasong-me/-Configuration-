package com.prasong.networkconfiguration;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceResponse;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.content.ContentValues;

import java.io.OutputStream;

public final class MainActivity extends Activity {
    private static final String WEB_APP_URL = "https://prasong-me.github.io/-Configuration-/";
    private static final String ALLOWED_HOST = "prasong-me.github.io";
    private WebView webView;
    private ProgressBar progressBar;
    private TextView errorView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        progressBar = new ProgressBar(this);
        errorView = new TextView(this);
        errorView.setTextColor(Color.DKGRAY);
        errorView.setTextSize(15f);
        errorView.setPadding(40, 60, 40, 40);
        errorView.setGravity(android.view.Gravity.CENTER);
        errorView.setVisibility(View.GONE);

        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(64, 64);
        progressParams.gravity = android.view.Gravity.CENTER;
        root.addView(progressBar, progressParams);
        root.addView(errorView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setSupportMultipleWindows(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebViewClient(new AppWebViewClient());
        webView.loadUrl(WEB_APP_URL);
    }

    private void showError(String message) {
        progressBar.setVisibility(View.GONE);
        errorView.setText("Network Configuration\n\n" + message
                + "\n\nเปิดการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง");
        errorView.setVisibility(View.VISIBLE);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    private final class AppWebViewClient extends WebViewClient {
        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            progressBar.setVisibility(View.VISIBLE);
            errorView.setVisibility(View.GONE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progressBar.setVisibility(View.GONE);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if ("https".equalsIgnoreCase(uri.getScheme())
                    && ALLOWED_HOST.equalsIgnoreCase(uri.getHost())) {
                return false;
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception ignored) {
            }
            return true;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                showError("โหลด Web App ไม่สำเร็จ: " + error.getDescription());
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (request.isForMainFrame() && response.getStatusCode() >= 400) {
                showError("Web App ตอบกลับ HTTP " + response.getStatusCode());
            }
        }
    }

    private final class AndroidBridge {
        @JavascriptInterface
        public void saveFile(String fileName, String mimeType, String base64Data) {
            if (base64Data == null || base64Data.length() > 14_000_000) {
                toast("ไฟล์ใหญ่เกินขนาดที่รองรับ");
                return;
            }
            String safeName = fileName == null ? "network-config"
                    : fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            if (safeName.length() > 120) safeName = safeName.substring(0, 120);
            String safeMime = (mimeType == null || mimeType.isBlank())
                    ? "application/octet-stream" : mimeType;

            try {
                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                values.put(MediaStore.Downloads.MIME_TYPE, safeMime);
                values.put(MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS + "/Network Configuration");

                Uri uri = getContentResolver().insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("MediaStore insert failed");

                try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                    if (output == null) throw new IllegalStateException("Download stream unavailable");
                    output.write(bytes);
                }
                toast("บันทึกไฟล์ไว้ที่ Downloads/Network Configuration");
            } catch (Exception e) {
                toast("บันทึกไฟล์ไม่สำเร็จ");
            }
        }

        private void toast(String message) {
            runOnUiThread(() ->
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
        }
    }
}
