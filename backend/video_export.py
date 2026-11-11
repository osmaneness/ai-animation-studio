import base64
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from uuid import uuid4


def render_video(scenes: list[dict]) -> Path:
    return _render_video({"scenes": scenes}, "IlkAnimasyon")


def render_character_video(image: bytes, media_type: str, motion: str) -> Path:
    image_url = f"data:{media_type};base64,{base64.b64encode(image).decode('ascii')}"
    return _render_video({"imageUrl": image_url, "motion": motion}, "KarakterAnimasyonu")


def _render_video(props: dict, composition_id: str) -> Path:
    frontend = Path(__file__).resolve().parent.parent / "frontend"

    entry = frontend / "app" / "RemotionRoot.tsx"

    if not entry.exists():
        entry = frontend / "src" / "app" / "RemotionRoot.tsx"

    if not entry.exists():
        raise RuntimeError("RemotionRoot.tsx dosyası bulunamadı.")

    npx = shutil.which("npx.cmd")

    if not npx:
        raise RuntimeError("Node.js komutu bulunamadı.")

    output_folder = frontend / "out"
    output_folder.mkdir(exist_ok=True)

    output_file = output_folder / f"animasyon-{uuid4().hex}.mp4"

    with tempfile.TemporaryDirectory() as temp_folder:
        props_file = Path(temp_folder) / "props.json"
        props_file.write_text(
            json.dumps(props, ensure_ascii=False),
            encoding="utf-8",
        )

        result = subprocess.run(
            [
                npx,
                "--no-install",
                "remotion",
                "render",
                str(entry),
                composition_id,
                str(output_file),
                "--props",
                str(props_file),
                "--concurrency",
                "1",
            ],
            cwd=frontend,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

        if result.returncode != 0:
            print(result.stdout)
            print(result.stderr)
            raise RuntimeError(
                "Video oluşturulamadı. Python terminalindeki hatayı kontrol et."
            )

    if not output_file.exists():
        raise RuntimeError("Video dosyası bulunamadı.")

    return output_file
