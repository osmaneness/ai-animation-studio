"use client";

import { Player } from "@remotion/player";
import { useState } from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

export type Motion = "slide" | "jump" | "zoom";

type Props = {
  imageUrl: string;
  motion: Motion;
};

export function CharacterMotion({ imageUrl, motion }: Props) {
  const frame = useCurrentFrame();
  const x = motion === "slide"
    ? interpolate(frame, [0, 75, 149], [-170, 170, -170], { extrapolateRight: "clamp" })
    : 0;
  const y = motion === "jump" ? -Math.abs(Math.sin(frame * Math.PI / 30)) * 65 : 0;
  const scale = motion === "zoom"
    ? interpolate(frame, [0, 75, 149], [0.85, 1.05, 0.85], { extrapolateRight: "clamp" })
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "white", overflow: "hidden" }}>
      <Img
        src={imageUrl}
        alt="Karakter hareket denemesi"
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          width: 420,
          height: 420,
          objectFit: "contain",
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
}

export default function CharacterMotionPreview({ imageUrl }: { imageUrl: string }) {
  const [motion, setMotion] = useState<Motion>("slide");
  const [rendering, setRendering] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function downloadVideo() {
    setRendering(true);
    setMessage("");
    setError("");
    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error("Karakter görseli açılamadı. Dosyayı yeniden seç.");
      const image = await imageResponse.blob();
      const form = new FormData();
      form.append("image", image, "karakter");
      form.append("motion", motion);
      const response = await fetch("http://localhost:8000/characters/render", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.detail === "string" ? data.detail : "Video oluşturulamadı. Tekrar dene.");
      }
      const blob = await response.blob();
      if (blob.type !== "video/mp4") throw new Error("Geçerli bir video yanıtı alınamadı.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "karakter-animasyonu.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage("Video hazır. İndirme başlatıldı.");
    } catch (error) {
      setError(error instanceof Error && error.message !== "Failed to fetch" ? error.message : "Arka sisteme ulaşılamadı. Python sunucusunu kontrol et.");
    } finally {
      setRendering(false);
    }
  }

  return (
    <section aria-labelledby="motion-title" className="mt-6 border-t border-slate-700 pt-6">
      <h3 id="motion-title" className="text-xl font-semibold">Karakterini hareketlendir</h3>
      <p className="mt-2 text-sm text-slate-400">Görselin tamamına uygulanan 5 saniyelik hareket denemesi. Kol ve bacak hareketleri henüz yok. Bu deneme yeni görsel üretmez ve API kotası kullanmaz.</p>
      <label htmlFor="character-motion" className="mb-2 mt-4 block text-sm font-medium">Hareket seç</label>
      <select
        id="character-motion"
        value={motion}
        disabled={rendering}
        onChange={(event) => setMotion(event.target.value as Motion)}
        className="mb-4 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-white"
      >
        <option value="slide">Sağa sola kayma</option>
        <option value="jump">Zıplama</option>
        <option value="zoom">Yakınlaşma</option>
      </select>
      <Player
        key={`${imageUrl}-${motion}`}
        component={CharacterMotion}
        inputProps={{ imageUrl, motion }}
        durationInFrames={150}
        compositionWidth={960}
        compositionHeight={540}
        fps={30}
        controls
        loop
        style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
      />
      <button type="button" onClick={downloadVideo} disabled={rendering} className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50">
        {rendering ? "Karakter videosu hazırlanıyor..." : "Karakteri MP4 indir"}
      </button>
      <p className="mt-2 text-xs text-slate-400">MP4 oluşturmak için bu görsel yerel Python sunucuna gönderilir. Yeni AI isteği yapılmaz.</p>
      <div aria-live="polite" className="mt-3 text-sm">
        {rendering && <p className="text-emerald-300">5 saniyelik video oluşturuluyor. Bu işlem biraz sürebilir.</p>}
        {message && <p className="text-emerald-300">{message}</p>}
        {error && <p role="alert" className="text-red-400">{error}</p>}
      </div>
    </section>
  );
}
