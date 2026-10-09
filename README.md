# FRH STEP Viewer V1

Android için çevrimdışı STEP / STP 3D görüntüleyici.

## Kaynak koordinatları ve görünüşler

Uygulama STEP okuyucusunun çözdüğü nokta koordinatlarını **değiştirmeden** kullanır. CAD modeli X/Y/Z eksenlerine göre yeniden döndürülmez; görünüş geçişleri kamerayla yapılır.

Varsayılan **Z-yukarı** görünüş eşlemesi:
- Üst: +Z yönünden modele bakış
- Alt: -Z yönünden
- Sağ: +X yönünden
- Sol: -X yönünden
- Ön: -Y yönünden
- Arka: +Y yönünden
- İzometrik: (+X, -Y, +Z) yönünden 3D diyagonal bakış

Bunlar uygulamanın varsayılan yön tanımlarıdır. STEP formatında SolidWorks'ün özelleştirilmiş görünüş etiketlerinin bulunduğu garanti edilmez. Model farklı koordinat referansıyla dışa aktarılmışsa görünüşlerin SolidWorks ekranıyla birebir örtüşmesi için ayrıca referans kalibrasyonu gerekir.

**Sığdır** geometrinin sınır kutusunun (bounding box) merkezini ekrana alır. Bu nokta gerçek kütle merkezi değildir. Gerçek kütle/volüm merkezi hesabı henüz uygulanmadı.

## APK

1. GitHub deposunda **Actions** sayfasına gidin.
2. **Build FRH STEP Viewer APK** iş akışının en son başarılı çalışmasını açın.
3. **Artifacts > FRH-STEP-Viewer-APK** dosyasını indirin.
4. ZIP içindeki **app-debug.apk** dosyasını Android telefonunuza kurun.

## Kontroller

Tek parmakla sabit merkez etrafında döndürme; iki parmakla zoom/kaydırma; görünüş seçimleri; Sığdır.

## Test durumu

GitHub Actions derlemesi kodu derler fakat gerçek STEP dosyasıyla SolidWorks eşleşmesini ve telefondaki görünümü otomatik doğrulamaz.
