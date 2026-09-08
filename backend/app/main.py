"""FastAPI application — stateless clinical engine.

No authentication, no persistence, no patient data in logs.
CORS restricted to the local dev origin only.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .api.schemas import TurnRequest, PreviewRequest
from .domain.engine import evaluate_turn
from .domain.validation import TurnValidationError

logger = logging.getLogger("numia")

app = FastAPI(
    title="Numia Engine API",
    version="parity-1",
    docs_url="/api/docs",
    redoc_url=None,
)

# CORS: only explicit local dev origins. Never open wildcard.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000",
                    "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ─── Domain-level validation errors → HTTP 422 ───────────────────────


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(TurnValidationError)
async def validation_error_handler(_request: Request, exc: TurnValidationError):
    """Translate domain validation to 422 without leaking patient data."""
    return JSONResponse(
        status_code=422,
        content={"detail": [exc.as_dict()]},
    )


# ─── API Endpoints ───────────────────────────────────────────────────

@app.post("/api/v1/turn/evaluate")
async def evaluate(body: TurnRequest):
    """Evaluate a clinical turn: balance, metrics, or preview."""
    patients = [p.model_dump() for p in body.patients]
    auxiliaries = [a.model_dump() for a in body.auxiliaries]
    result = evaluate_turn(
        patients=patients,
        auxiliaries=auxiliaries,
        assignments=body.assignments,
        action=body.action,
    )
    return result


@app.post("/api/v1/turn/preview")
async def preview(body: PreviewRequest):
    """Preview scores for a draft patient/auxiliary without full validation."""
    patients = [p.model_dump(exclude_none=True) for p in body.patients]
    auxiliaries = [a.model_dump(exclude_none=True) for a in body.auxiliaries]
    result = evaluate_turn(
        patients=patients,
        auxiliaries=auxiliaries,
        action="preview",
    )
    return result


@app.get("/api/health")
async def health():
    return {"status": "ok", "engine_version": "parity-1"}


# ─── Serve frontend static files (dev mode) ─────────────────────────

FRONTEND_DIR = Path(__file__).resolve().parents[2] / "public"
if (FRONTEND_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="public")

