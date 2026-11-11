from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Scene(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    id: int = Field(ge=1)
    text: str = Field(min_length=1, max_length=160)
    duration_seconds: int = Field(ge=5, le=5)
    environment: Literal["forest", "plain"]
    time_of_day: Literal["day", "night"]
    action: Literal["walk", "wait", "jump"]


class StoryboardPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenes: list[Scene] = Field(min_length=1, max_length=6)
