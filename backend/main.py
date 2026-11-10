import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="AI Animation Studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class StoryRequest(BaseModel):
    story: str = Field(min_length=10, max_length=2000)


@app.get("/health")
def health():
    return {"durum": "hazır", "mesaj": "Arka sistem çalışıyor"}


@app.post("/storyboard")
def create_storyboard(request: StoryRequest):
    sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?]+", request.story)
        if sentence.strip()
    ]

    scenes = [
        {
            "id": index + 1,
            "text": sentence,
            "duration_seconds": 5,
        }
        for index, sentence in enumerate(sentences)
    ]

    return {
        "mode": "demo",
        "scenes": scenes,
        "total_duration_seconds": len(scenes) * 5,
    }

from fastapi import HTTPException
from fastapi.responses import FileResponse
from video_export import render_video


@app.post("/render")
def create_video(request: StoryRequest):
    storyboard = create_storyboard(request)
    scenes = storyboard["scenes"]

    if not scenes:
        raise HTTPException(
            status_code=400,
            detail="Lütfen en az bir cümle yaz.",
        )

    if len(scenes) > 6:
        raise HTTPException(
            status_code=400,
            detail="Bu prototipte en fazla 6 sahne oluşturabilirsin.",
        )

    try:
        video_path = render_video(scenes)
    except RuntimeError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

    return FileResponse(
        path=video_path,
        media_type="video/mp4",
        filename="animasyon.mp4",
    )