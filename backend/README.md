# Yerel backend

Ana proje klasöründen paketleri kur:

```powershell
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

`backend/.env` dosyasında `GEMINI_API_KEY` tanımlı olmalı. Örnek alanlar
`.env.example` dosyasında bulunur. Gerçek anahtarı Git'e ekleme.

Sunucuyu ana proje klasöründen başlat:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --reload --port 8000
```

`POST /storyboard`, hikâyeyi Gemini ile en fazla altı adet beş saniyelik sahneye
çevirir. Ortam, zaman ve hareket seçenekleri backend'de doğrulanır.
Gemini erişilemezse hata döner; demo planı üretilmez.

`POST /render`, `{ "scenes": [...] }` gövdesiyle önizlenen planı alır;
yeniden Gemini çağırmadan aynı sahnelerden MP4 oluşturur. Bunun için frontend
paketleri ve Remotion'ın tarayıcısı kurulu olmalıdır.

Bu sürüm yerel prototiptir. Video üretimi istek tamamlanana kadar bekler;
üyelik ve iş kuyruğu henüz eklenmedi.

## Karakter görseli

`POST /characters/generate`, `{ "description": "Kırmızı atkılı küçük bir tilki" }`
gövdesini alır. Gemini Türkçe tarifi İngilizceye çevirir; Cloudflare Workers AI
FLUX.1 Schnell tek bir JPEG üretir. `.env` içinde `CLOUDFLARE_ACCOUNT_ID` ve
Workers AI erişimine sahip `CLOUDFLARE_API_TOKEN` tanımlanmalıdır.

Görsel yanıtta döner; sunucuya kaydedilmez. Kullanıcı görseli indirebilir.
Görsel üretimi, Gemini ve Cloudflare kotalarını kullanır. Otomatik tekrar
isteği yapılmaz.

`POST /characters/render`, multipart form olarak `image` dosyası ve
`motion` (`slide`, `jump`, `zoom`) alanlarını alır. En fazla 10 MB JPG,
PNG veya WebP kabul edilir. Görsel geçici render verisine eklenir; yeni
AI isteği gönderilmez. `KarakterAnimasyonu` kompozisyonu önizleme ile aynı
bileşeni kullanarak 960×540 boyutunda, 30 fps, 5 saniyelik MP4 oluşturur.
Karakter henüz hikâyenin sahnelerine bağlanmadı; görselin tamamı hareket eder.
