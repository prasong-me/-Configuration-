package com.prasongme.configuration

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import java.io.IOException

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var backCallback: OnBackInvokedCallback? = null
    private var pendingDocumentContent: String? = null

    companion object {
        private const val REQUEST_CREATE_DOCUMENT = 4101
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(AndroidExportBridge(), "AndroidExport")
        setContentView(webView)
        webView.loadUrl("file:///android_asset/web/index.html")

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
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
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
            // The WebView remains usable; the failed save is not treated as a successful export.
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
