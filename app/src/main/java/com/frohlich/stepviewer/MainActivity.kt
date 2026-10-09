package com.frohlich.stepviewer

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.util.concurrent.Executors

class MainActivity : ComponentActivity() {
 private lateinit var web: WebView
 @Volatile private var modelFile: File? = null
 private var modelName = ""
 private var ready = false
 private val worker = Executors.newSingleThreadExecutor()
 private val picker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { it?.let(::openUri) }
 private val loader by lazy {
   WebViewAssetLoader.Builder()
     .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
     .addPathHandler("/model/", WebViewAssetLoader.PathHandler { path ->
       if(path != "current.step") return@PathHandler null
       try { WebResourceResponse("application/octet-stream",null,FileInputStream(modelFile ?: return@PathHandler null)).apply {
         responseHeaders=mapOf("Cache-Control" to "no-store","Access-Control-Allow-Origin" to "*")
       } } catch(e:Exception){ null }
     }).build()
 }
 override fun onCreate(savedInstanceState: Bundle?) {
   super.onCreate(savedInstanceState)
   web=WebView(this).apply {
     settings.javaScriptEnabled=true
     settings.domStorageEnabled=true
     settings.allowFileAccess=false
     settings.allowContentAccess=false
     webChromeClient=WebChromeClient()
     addJavascriptInterface(object {
       @JavascriptInterface fun openFile(){runOnUiThread { picker.launch(arrayOf("*/*")) }}
     },"AndroidBridge")
     webViewClient=object:WebViewClient(){
       override fun shouldInterceptRequest(view:WebView?, request:WebResourceRequest?):WebResourceResponse?=
         request?.url?.let { loader.shouldInterceptRequest(it) }
       override fun onPageFinished(view:WebView?,url:String?){ready=true;notifyLoaded()}
     }
     loadUrl("https://appassets.androidplatform.net/assets/index.html")
   }
   setContentView(web)
   intent?.data?.let(::openUri)
 }
 private fun js(code:String){if(ready) web.evaluateJavascript(code,null)}
 private fun notifyLoaded(){
   if(!ready || modelFile==null)return
   js("window.loadStepFromAndroid(${JSONObject.quote(modelName)},${modelFile!!.length()})")
 }
 private fun openUri(uri:Uri){
   val name=try {contentResolver.query(uri,arrayOf(OpenableColumns.DISPLAY_NAME),null,null,null)?.use {
     if(it.moveToFirst()) it.getString(0) else null
   }}catch(e:Exception){null} ?: uri.lastPathSegment ?: "part.step"
   if(!name.lowercase().let{it.endsWith(".step")||it.endsWith(".stp")}){
      js("window.showError('Yalnız STEP ve STP dosyaları destekleniyor.')");return
   }
   js("window.showStatus('Dosya hazırlanıyor…')")
   worker.execute {
      try {
        val f=File(cacheDir,"model_${System.nanoTime()}.step")
        contentResolver.openInputStream(uri).use{ source ->
          requireNotNull(source){"Dosya açılamadı"}
          f.outputStream().use { source.copyTo(it) }
        }
        require(f.length()>0){"Boş dosya"}
        val old=modelFile
        modelFile=f
        old?.delete()
        runOnUiThread{modelName=name;notifyLoaded()}
      }catch(e:Exception){runOnUiThread{js("window.showError(${JSONObject.quote(e.message?:"Okuma hatası")})")}}
   }
 }
 override fun onNewIntent(intent:Intent){super.onNewIntent(intent);setIntent(intent);intent.data?.let(::openUri)}
 override fun onDestroy(){web.destroy();worker.shutdown();super.onDestroy()}
}
