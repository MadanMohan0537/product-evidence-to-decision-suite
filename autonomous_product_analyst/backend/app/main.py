"""FastAPI boundary for the analysis engine."""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .database import Database
from .metrics import METRICS
from .service import analyze_question


class QuestionRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    end: str | None = None
    window_days: int = Field(default=7, ge=2, le=90)


app = FastAPI(title="Autonomous Product Analyst", version="0.1.0")
database = Database(os.getenv("ANALYTICS_DB", "data/product_analytics.db"))


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "autonomous-product-analyst", "metrics": list(METRICS)}


@app.post("/api/analyze")
def analyze(payload: QuestionRequest):
    try:
        return analyze_question(database, payload.question, payload.end, payload.window_days)
    except (ValueError, OSError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


frontend = Path(__file__).resolve().parents[2] / "frontend"
app.mount("/assets", StaticFiles(directory=frontend), name="assets")


@app.get("/")
def home():
    return FileResponse(frontend / "index.html")
