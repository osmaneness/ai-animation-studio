"use client";

import { useState } from "react";
import AnimationPreview, { type Scene } from "./AnimationPreview";
import CharacterDesigner from "./CharacterDesigner";

type Storyboard = {
  mode: string;
  scenes: Scene[];
  total_duration_seconds: number;
};

export default function Home() {
  async function downloadVideo() {
  setError("");

  if (!result) {
    setError("Önce sahne planı oluştur ve önizlemeyi kontrol et.");
    return;
  }

  setRendering(true);

  try {
    const response = await fetch("http://localhost:8000/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes: result.scenes }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      throw new Error(
        typeof data?.detail === "string"
          ? data.detail
          : "Video oluşturulamadı. Python terminalini kontrol et."
      );
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "animasyon.mp4";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Video indirilemedi. Tekrar dene."
    );
  } finally {
    setRendering(false);
  }
}
  const [story, setStory] = useState("");
  const [result, setResult] = useState<Storyboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);

  async function createStoryboard() {
    setError("");
    setResult(null);

    if (story.trim().length < 10) {
      setError("Lütfen en az 10 karakterlik bir hikâye yaz.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: story.trim() }),
        signal: AbortSignal.timeout(35000),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Sahne planı oluşturulamadı. Hikâyeyi kontrol edip tekrar dene."
        );
      }

      const data: Storyboard = await response.json();
      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error && error.name === "TimeoutError"
          ? "Gemini yanıtı gecikti. Biraz sonra tekrar dene."
          : error instanceof Error && error.message !== "Failed to fetch"
            ? error.message
            : "Arka sisteme ulaşılamadı. Python sunucusunun açık olduğunu kontrol et."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <p className="mb-4 text-sm font-semibold text-violet-400">
          AI ANIMATION STUDIO
        </p>

        <h1 className="mb-6 text-4xl font-bold">
          Hikâyeni animasyona dönüştür.
        </h1>

        <p className="mb-8 text-slate-300">
          Hikâyeni yaz, ilk sahne planını oluştur.
        </p>

        <CharacterDesigner />

        <h2 className="mb-4 text-2xl font-bold">Robotla hikâye denemesi</h2>
        <label htmlFor="story" className="mb-3 block font-medium">
          Hikâyen
        </label>

        <textarea
          id="story"
          value={story}
          onChange={(event) => {
            setStory(event.target.value);
            setResult(null);
            setError("");
          }}
          disabled={loading || rendering}
          rows={5}
          maxLength={2000}
          placeholder="Küçük robot ormanda yürür. Bir tilkiyle karşılaşır. Birlikte eve dönerler."
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-white placeholder:text-slate-500"
        />

        <button
          type="button"
          onClick={createStoryboard}
          disabled={loading || rendering}
          className="mt-5 rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "Gemini sahneleri hazırlıyor..." : "Sahne planı oluştur"}
        </button>
        <button
          type="button"
          onClick={downloadVideo}
          disabled={rendering || loading || !result}
          className="mt-4 block rounded-xl bg-emerald-600 px-6 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
        >
          {rendering ? "Video hazırlanıyor, lütfen bekle..." : "MP4 oluştur ve indir"}
        </button>

        <p className="mt-2 text-sm text-slate-400">
          Önce sahne planını oluştur. MP4, önizlemedeki aynı sahnelerden hazırlanır.
        </p>

        <p className="mt-4 text-sm text-slate-400">
          Gemini hikâyeni en fazla 6 sahneye ayırır; ortamı, zamanı ve hareketi seçer.
          Her sahne 5 saniyedir. Bu prototipte robot yürür, bekler veya zıplar;
          diğer karakterler ve serbest hareketler henüz desteklenmez.
          Ücretsiz API limitleri geçerlidir; denemelerde örnek hikâyeler kullan.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-red-400">
            {error}
          </p>
        )}

        <div aria-live="polite">
          {result && (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Sahne planın</h2>
              <div className="mt-5">
                <AnimationPreview scenes={result.scenes} />
              </div>

              <p className="mt-2 text-slate-400">
                {result.scenes.length} sahne · Toplam{" "}
                {result.total_duration_seconds} saniye
              </p>

              <ol className="mt-5 space-y-4">
                {result.scenes.map((scene) => (
                  <li
                    key={scene.id}
                    className="rounded-xl border border-slate-700 bg-slate-900 p-5"
                  >
                    <h3 className="font-semibold text-violet-300">
                      Sahne {scene.id} · {scene.duration_seconds} saniye
                    </h3>
                    <p className="mt-2 text-slate-200">{scene.text}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {scene.environment === "forest" ? "Orman" : "Açık alan"}
                      {" · "}{scene.time_of_day === "night" ? "Gece" : "Gündüz"}
                      {" · "}{scene.action === "jump" ? "Zıplama" : scene.action === "wait" ? "Bekleme" : "Yürüme"}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
