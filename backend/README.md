# Satrk Backend

Hybrid AI backend for detecting India's digital-arrest and
authority-impersonation scams.

## Architecture

```
Frontend (React)
      │  HTTP
      ▼
FastAPI (routers/analysis.py, routers/health.py)
      │
      ▼
AnalysisService (Layer D — aggregation)
      │
      ├── GroqService        (Layer B — LLM contextual reasoning)
      ├── SemanticService    (Layer A — sentence-embedding understanding)
      └── technical_signals  (Layer C — regex-based supporting signals)
```

Every score returned to the frontend is computed here, on the
backend. The frontend never generates a risk score, verdict, or
explanation itself.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now open .env and paste your real GROQ_API_KEY
```

Get a free Groq API key at https://console.groq.com/keys — paste it
into `.env` (NOT into any frontend file). `.env` never leaves the
server and is never returned in any API response.

### Installing Tesseract (for screenshot OCR)

- **Linux**: `sudo apt install tesseract-ocr`
- **macOS**: `brew install tesseract`
- **Windows**: install the UB-Mannheim build and ensure it's on PATH.

If Tesseract isn't installed, the app still runs — `/api/health` will
simply report `ocr: not_connected`, and `/api/analyze-image` will
return a clear error instead of a fake result.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Then open http://localhost:8000/api/health — you should see the real
status of every service.

## Testing the health endpoint

```bash
curl http://localhost:8000/api/health
```

Expected shapes:

**Everything configured and working:**
```json
{
  "status": "healthy",
  "services": {
    "backend": { "status": "connected" },
    "groq": { "status": "connected", "configured": true, "connected": true },
    "semantic_ai": { "status": "connected" },
    "ocr": { "status": "connected" }
  }
}
```

**GROQ_API_KEY missing:**
```json
{
  "status": "degraded",
  "services": {
    "groq": { "status": "not_configured", "configured": false, "connected": false }
  }
}
```

## Notes on the AI layers

- **Layer A (semantic)** uses `sentence-transformers/all-MiniLM-L6-v2`
  — small (~80MB), CPU-friendly, no GPU required. First run downloads
  the model from Hugging Face (needs internet once); it's cached
  locally afterward.
- **Layer B (Groq)** uses the official `groq` SDK with strict JSON-mode
  output, validated with Pydantic before it's trusted anywhere.
- **Layer C (technical signals)** is intentionally narrow (URLs, phone
  numbers, explicit OTP/payment asks, formatting) and is capped so it
  can never dominate the final score — see `WEIGHT_TECHNICAL` in
  `analysis_service.py`.

If Groq is unavailable for a request, the pipeline still runs Layer A
+ Layer C and clearly reports `"analysis_engines_unavailable": ["groq"]`
rather than silently faking an LLM result. If *neither* Groq nor the
semantic layer is available, `/api/analyze` returns
`"success": false, "analysis_available": false"` with an honest error
— never a fabricated score.
