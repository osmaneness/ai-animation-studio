"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import CharacterMotionPreview from "./CharacterMotionPreview";

export default function CharacterDesigner() {
  const [description, setDescription] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("karakter.jpg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  function openSavedImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("10 MB'den küçük bir JPG, PNG veya WebP görseli seç.");
      event.target.value = "";
      return;
    }
    setError("");
    setImageUrl(URL.createObjectURL(file));
    setDownloadName(file.name);
    setGeneratedDescription(file.name);
    event.target.value = "";
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const prompt = description.trim();
    if (prompt.length < 5) {
      setError("Karakterini en az 5 karakterle tarif et.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/characters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: prompt }),
        signal: AbortSignal.timeout(95000),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Görsel oluşturulamadı. Biraz sonra tekrar dene."
        );
      }
      const blob = await response.blob();
      if (blob.type !== "image/jpeg") throw new Error("Geçerli bir görsel alınamadı.");
      setImageUrl(URL.createObjectURL(blob));
      setDownloadName("karakter.jpg");
      setGeneratedDescription(prompt);
    } catch (error) {
      setError(
        error instanceof Error && error.name === "TimeoutError"
          ? "Görsel üretimi gecikti. Biraz bekleyip tekrar dene."
          : error instanceof Error && error.message !== "Failed to fetch"
            ? error.message
            : "Arka sisteme ulaşılamadı. Python sunucusunun açık olduğunu kontrol et."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="character-title" className="mb-10 rounded-2xl border border-violet-800 bg-slate-900 p-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-300">Yeni · Karakter tasarımı</p>
      <h2 id="character-title" className="text-2xl font-bold">Hayalindeki karakteri tarif et.</h2>
      <p className="mt-3 text-sm text-slate-300">Türkçe yaz; senin tarifine göre tek bir 2D çizgi film karakteri oluşturalım.</p>
      <form onSubmit={generate} className="mt-5">
        <label htmlFor="character-description" className="mb-2 block font-medium">Karakterin nasıl görünsün?</label>
        <textarea
          id="character-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Kırmızı atkılı küçük turuncu bir tilki; büyük gözleri ve kabarık kuyruğu olsun."
          rows={3}
          minLength={5}
          maxLength={700}
          required
          disabled={loading}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-white placeholder:text-slate-500 disabled:opacity-60"
        />
        <button type="submit" disabled={loading} className="mt-4 rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50">
          {loading ? "Karakter hazırlanıyor..." : "Karakter görseli oluştur"}
        </button>
      </form>
      <p className="mt-3 text-sm text-slate-400">Görsel üretiminde ücretsiz kullanım kotaları geçerlidir. Oluşan görselin altında hareket seçebilir ve 5 saniyelik MP4 indirebilirsin.</p>
      <label htmlFor="saved-character" className="mb-2 mt-5 block text-sm font-medium">Daha önce indirdiğin karakter görselini aç</label>
      <input
        id="saved-character"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={openSavedImage}
        disabled={loading}
        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-white"
      />
      <p className="mt-2 text-xs text-slate-400">Seçtiğin dosya yalnızca tarayıcında açılır. Yeni görsel üretimi yapılmaz.</p>
      <div aria-live="polite" className="mt-3">
        {loading && <p className="text-sm text-violet-300">Tarifin hazırlanıyor ve karakterin çiziliyor. Bu işlem biraz sürebilir.</p>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </div>
      {imageUrl && (
        <figure className="mt-6">
          <Image src={imageUrl} alt={generatedDescription} width={1024} height={1024} unoptimized className="h-auto w-full rounded-xl bg-white" />
          <figcaption className="mt-3 text-sm text-slate-300">{generatedDescription}</figcaption>
          <a href={imageUrl} download={downloadName} className="mt-4 inline-block rounded-xl border border-slate-600 px-5 py-2 hover:bg-slate-800">Görseli indir</a>
          <CharacterMotionPreview imageUrl={imageUrl} />
        </figure>
      )}
    </section>
  );
}
