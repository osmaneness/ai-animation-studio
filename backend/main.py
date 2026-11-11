from ai_director import PlanningError, plan_story
from scene_models import StoryboardPlan

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from video_export import render_video

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


@app.get("/health")
def health():
    return {"durum": "hazır", "mesaj": "Arka sistem çalışıyor"}


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
