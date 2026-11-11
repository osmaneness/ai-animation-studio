from ai_director import PlanningError, plan_story
from scene_models import StoryboardPlan

from typing import Literal

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from video_export import render_video, render_character_video
from character_images import ImageGenerationError, create_character_image

app = FastAPI(title="AI Animation Studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class StoryRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    story: str = Field(min_length=10, max_length=2000)


class CharacterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    description: str = Field(min_length=5, max_length=700)


@app.post("/characters/generate")
def generate_character(request: CharacterRequest):
    try:
        image = create_character_image(request.description)
    except ImageGenerationError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from None
    return Response(
        content=image,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store", "Content-Disposition": 'inline; filename="karakter.jpg"'},
    )


@app.get("/health")
def health():
    return {"durum": "hazır", "mesaj": "Arka sistem çalışıyor"}


@app.post("/characters/render")
def render_character(
    image: UploadFile = File(...),
    motion: Literal["slide", "jump", "zoom"] = Form("slide"),
):
    try:
        content = image.file.read(10 * 1024 * 1024 + 1)
    finally:
        image.file.close()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Görsel en fazla 10 MB olabilir.")
    if content.startswith(b"\xff\xd8\xff"):
        media_type = "image/jpeg"
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        media_type = "image/png"
    elif content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        media_type = "image/webp"
    else:
        raise HTTPException(status_code=400, detail="JPG, PNG veya WebP görseli gerekli.")
    try:
        video_path = render_character_video(content, media_type, motion)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from None
    return FileResponse(path=video_path, media_type="video/mp4", filename="karakter-animasyonu.mp4")


@app.post("/storyboard")
def create_storyboard(request: StoryRequest):
    try:
        plan = plan_story(request.story)
    except PlanningError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from None
    scenes = [scene.model_dump() for scene in plan.scenes]

    return {
        "mode": "ai",
        "scenes": scenes,
        "total_duration_seconds": len(scenes) * 5,
    }

@app.post("/render")
def create_video(request: StoryboardPlan):
    # Önizlenen planı kullan; MP4 için yeniden AI isteği gönderme.
    scenes = [scene.model_dump() for scene in request.scenes]
    for index, scene in enumerate(scenes, start=1):
        scene["id"] = index

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
