from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents import run_multi_agent_flow
from database import init_db, list_incidents, list_resources

app = FastAPI(
    title="AegisFlow API",
    description="Multi-agent AI disaster response coordination API for Bangalore.",
    version="2.0.0",
)

# Allow all origins so judges can run from any machine/port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    incidents: list[dict[str, Any]] | None = None
    resources: list[dict[str, Any]] | None = None


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "system": "AegisFlow", "version": "2.0.0"}


@app.get("/incidents")
def get_incidents():
    return {"incidents": list_incidents()}


@app.get("/resources")
def get_resources():
    return {"resources": list_resources()}


@app.post("/analyze")
async def analyze(payload: AnalysisRequest | None = None):
    incidents = payload.incidents if payload and payload.incidents else list_incidents()
    resources = payload.resources if payload and payload.resources else list_resources()
    result = await run_multi_agent_flow(incidents, resources)
    return {"incidents": incidents, "resources": resources, **result}


@app.post("/allocate")
async def allocate(payload: AnalysisRequest | None = None):
    incidents = payload.incidents if payload and payload.incidents else list_incidents()
    resources = payload.resources if payload and payload.resources else list_resources()
    result = await run_multi_agent_flow(incidents, resources)
    return {
        "allocations": result["strategy_plan"].get("allocations", []),
        "commander_decision": result["commander_decision"],
        "agent_trace": result,
    }


@app.get("/demo")
async def demo():
    """Returns the default Bangalore scenario as a preloaded demo payload."""
    incidents = list_incidents()
    resources = list_resources()
    result = await run_multi_agent_flow(incidents, resources)
    return {
        "incidents": incidents,
        "resources": resources,
        **result,
        "demo": True,
    }
