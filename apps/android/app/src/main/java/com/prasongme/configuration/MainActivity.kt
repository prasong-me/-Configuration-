package com.prasongme.configuration

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import java.io.IOException

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var backCallback: OnBackInvokedCallback? = null
    private var pendingDocumentContent: String? = null

    companion object {
        private const val REQUEST_CREATE_DOCUMENT = 4101
        private const val ASSET_BASE_URL = "https://appassets.androidplatform.net/assets/web/"
        private const val TAG = "ConfigurationWebView"
    }

    private inner class AndroidExportBridge {
        @JavascriptInterface
        fun sendToApp(name: String, mime: String, content: String) {
            runOnUiThread {
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = if (mime.isBlank()) "text/plain" else mime
                    putExtra(Intent.EXTRA_TEXT, content)
                    putExtra(Intent.EXTRA_TITLE, name)
                }
                startActivity(Intent.createChooser(intent, "Send configuration"))
            }
        }

        @JavascriptInterface
        fun saveFile(name: String, mime: String, content: String) {
            runOnUiThread {
                pendingDocumentContent = content
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = if (mime.isBlank()) "application/octet-stream" else mime
                    putExtra(Intent.EXTRA_TITLE, name)
                }
                startActivityForResult(intent, REQUEST_CREATE_DOCUMENT)
            }
        }
    }

    private inner class LocalContentWebViewClient(
        private val assetLoader: WebViewAssetLoader
    ) : WebViewClientCompat() {
        override fun shouldInterceptRequest(
            view: WebView,
            request: WebResourceRequest
        ): WebResourceResponse? {
            val response = assetLoader.shouldInterceptRequest(request.url)
            if (response != null) {
                Log.i(TAG, "IRIS_WEBAPP_ASSET_SERVED path=${request.url.path}")
            }
            return response
        }

        override fun shouldInterceptRequest(
            view: WebView,
            url: String
        ): WebResourceResponse? {
            val uri = android.net.Uri.parse(url)
            val response = assetLoader.shouldInterceptRequest(uri)
            if (response != null) {
                Log.i(TAG, "IRIS_WEBAPP_ASSET_SERVED path=${uri.path}")
            }
            return response
        }

        override fun onPageFinished(view: WebView, url: String) {
            super.onPageFinished(view, url)
            Log.i(TAG, "IRIS_WEBAPP_PAGE_FINISHED url=$url title=${view.title.orEmpty()}")
            view.evaluateJavascript("(function(){var root=document.getElementById('root');return document.title+'|'+document.readyState+'|'+(root?root.childElementCount:-1);})()") { result ->
                Log.i(TAG, "IRIS_WEBAPP_DOM_READY $result")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            setAllowFileAccessFromFileURLs(false)
            setAllowUniversalAccessFromFileURLs(false)
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        webView.webViewClient = LocalContentWebViewClient(assetLoader)
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(AndroidExportBridge(), "AndroidExport")
        setContentView(webView)
        webView.loadUrl(ASSET_BASE_URL + "index.html")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val callback = OnBackInvokedCallback {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
            backCallback = callback
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                callback
            )
        }
    }

    @Deprecated("Deprecated in Android API 33; retained for API 31/32 compatibility.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQUEST_CREATE_DOCUMENT) return
        val content = pendingDocumentContent
        pendingDocumentContent = null
        if (resultCode != RESULT_OK || data?.data == null || content == null) return

        try {
            contentResolver.openOutputStream(data.data!!)?.use { output ->
                output.write(content.toByteArray(Charsets.UTF_8))
            }
        } catch (_: IOException) {
            Log.e(TAG, "Failed to save exported configuration")
        }
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            backCallback?.let { onBackInvokedDispatcher.unregisterOnBackInvokedCallback(it) }
            backCallback = null
        }
        webView.removeJavascriptInterface("AndroidExport")
        webView.destroy()
        super.onDestroy()
    }
}
