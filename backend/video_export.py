import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from uuid import uuid4


def render_video(scenes: list[dict]) -> Path:
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
            json.dumps({"scenes": scenes}, ensure_ascii=False),
            encoding="utf-8",
        )

        result = subprocess.run(
            [
                npx,
                "--no-install",
                "remotion",
                "render",
                str(entry),
                "IlkAnimasyon",
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