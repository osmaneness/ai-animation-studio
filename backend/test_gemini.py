import os
import re
import subprocess
import sys
from pathlib import Path


def check_connection():
    from dotenv import load_dotenv
    from google import genai
    from google.genai import types

    load_dotenv(Path(__file__).resolve().parent / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Anahtar bulunamadı. backend/.env dosyasını kontrol et.")
        return 1

    model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    print(f"Anahtar bulundu. {model} bağlantısı deneniyor...", flush=True)
    try:
        with genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=20000,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        ) as client:
            response = client.models.generate_content(
                model=model,
                contents="Türkçe olarak yalnızca şunu yaz: Hazırım.",
                config=types.GenerateContentConfig(max_output_tokens=256),
            )
            if not response.text:
                print("İstek tamamlandı fakat metin yanıtı alınamadı.")
                return 1
            print("Gemini yanıtı:", response.text)
            return 0
    except Exception as error:
        message = str(error).replace(api_key, "[GİZLİ]")
        message = re.sub(r"AIza[\w-]+", "[GİZLİ]", message)
        print(f"Bağlantı hatası ({type(error).__name__}): {message}")
        return 1


if __name__ == "__main__":
    if "--worker" in sys.argv:
        sys.exit(check_connection())
    # Üst süreç, bağlantı takılsa bile testi 35 saniyede sonlandırır.
    try:
        result = subprocess.run(
            [sys.executable, "-B", "-u", str(Path(__file__).resolve()), "--worker"],
            timeout=35,
        )
        sys.exit(result.returncode)
    except subprocess.TimeoutExpired:
        print("Test 35 saniyeyi geçtiği için durduruldu. Ağ bağlantısı kontrol edilmeli.")
        sys.exit(1)
    except KeyboardInterrupt:
        print("Test durduruldu.")
        sys.exit(130)
