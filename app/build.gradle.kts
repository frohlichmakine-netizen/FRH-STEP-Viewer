import java.net.URL
plugins {
 id("com.android.application")
 id("org.jetbrains.kotlin.android")
}
android {
 namespace = "com.frohlich.stepviewer"
 compileSdk = 35
 defaultConfig { applicationId = "com.frohlich.stepviewer"; minSdk = 26; targetSdk = 35; versionCode = 1; versionName = "1.0.0" }
 compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget = "17" }
}
dependencies {
 implementation("androidx.activity:activity-ktx:1.9.3")
 implementation("androidx.webkit:webkit:1.12.1")
}
val vendors = mapOf(
 "occt-import-js.js" to "https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.js",
 "occt-import-js.wasm" to "https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.wasm",
 "three.module.js" to "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js"
)
val fetchVendorAssets = tasks.register("fetchVendorAssets") {
 val folder = layout.projectDirectory.dir("src/main/assets/vendor").asFile
 outputs.dir(folder)
 doLast {
  folder.mkdirs()
  vendors.forEach { (name, url) ->
   val destination = folder.resolve(name)
   if (!destination.exists() || destination.length() < 1000L) {
    URL(url).openConnection().apply { connectTimeout = 30000; readTimeout = 120000 }.getInputStream().use { input ->
     destination.outputStream().use { output -> input.copyTo(output) }
    }
    check(destination.length() > 1000L) { "Unable to download $name" }
   }
  }
 }
}
tasks.named("preBuild") { dependsOn(fetchVendorAssets) }