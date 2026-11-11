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
