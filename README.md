# FRH STEP Viewer V1

Android için çevrimdışı STEP/STP 3D dosya görüntüleyici.

## APK oluşturma (Android Studio gerektirmez)

1. GitHub deposunda **Actions** sayfasına gidin.
2. **Build FRH STEP Viewer APK** iş akışını seçin.
3. **Run workflow** > **Run workflow** ile derlemeyi başlatın.
4. Başarılı olursa çalıştırma sayfasında **Artifacts > FRH-STEP-Viewer-APK** dosyasını indirin.
5. ZIP içindeki **app-debug.apk** dosyasını Android telefona aktararak kurun.

## Özellikler

- Android sistem dosya seçicisi ile STEP / STP dosyası açma.
- Open CASCADE (WebAssembly) ile geometri çözümleme, Three.js ile çevrimdışı görüntüleme.
- Tek parmakla döndürme; iki parmakla büyütme ve kaydırma.
- İzometrik, ön, arka, sol, sağ, üst görünüşler ve ekrana sığdır.

## Durum

Kaynak kod GitHub'a gönderildi. GitHub Actions derlemesinin başarıyla tamamlandığı ve uygulamanın gerçek cihazda STEP dosyası açabildiği henüz doğrulanmadı. İlk derleme hata verirse Actions çalıştırma kaydını inceleyerek düzeltmek gerekir.
