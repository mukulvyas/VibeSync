"""
VibeSync — Agentic AI Stadium Companion
FastAPI backend: routes, WebSocket, background simulation, and scenario injection.
"""

# Load .env file if present (local dev). On Cloud Run, env vars are injected directly.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed; env vars must be set externally

import asyncio
import json
import os
import random
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ── Google Cloud Logging ───────────────────────────────
try:
    import google.cloud.logging
    logging_client = google.cloud.logging.Client()
    logging_client.setup_logging()
    import logging
    logger = logging.getLogger("vibesync")
    logger.info("VibeSync Cloud Logging initialized.")
except Exception:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("vibesync")
    logger.info("Local logging initialized (Cloud Logging fallback).")

from models import (
    PathRequest, PathResponse, SOSRequest, SOSResponse,
    JoinQueueRequest, JoinQueueResponse, VenueState, StaffAlert,
    ChatRequest, ChatResponse,
)
from typing import Any, Optional
from pydantic import BaseModel

class ConciergeMessage(BaseModel):
    message: str
    venue_state: dict = {}
    history: list = []

class AgentInsightRequest(BaseModel):
    venue_state: dict = {}
    event_type: Optional[str] = None

class StadiumUpdateRequest(BaseModel):
    venue_state: dict = {}
    last_event: Optional[str] = None
    history: list = []
    last_category: Optional[str] = None
from venue import VenueSimulator
from agents.flow_agent import FlowAgent
from agents.sync_agent import SyncAgent
from agents.guardian_agent import GuardianAgent
from agents.gemini_agent import (
    get_concierge_response, 
    get_agent_insight,
    get_stadium_update
)
from line_buddy import LineBuddy

# ── Global State ───────────────────────────────────────
venue = VenueSimulator()
flow_agent = FlowAgent(venue)
sync_agent = SyncAgent(venue)
guardian_agent = GuardianAgent(venue)
line_buddy = LineBuddy()
guardian_agent.set_flow_agent(flow_agent)

# Connected WebSocket clients
ws_clients: set[WebSocket] = set()

from typing import Any
# Latest incentive events (cleared each tick)
latest_incentives: list[Any] = []

# Agent log messages
agent_logs: list[dict[str, str]] = []
MAX_LOGS = 50


def add_agent_log(agent: str, message: str, level: str = "info"):
    """Add a log entry from an agent."""
    agent_logs.insert(0, {
        "agent": agent,
        "message": message,
        "level": level,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    # Log to Google Cloud Logging
    log_msg = f"[{agent}] {message}"
    if level == "critical": logger.error(log_msg)
    elif level == "warning": logger.warning(log_msg)
    else: logger.info(log_msg)

    if len(agent_logs) > MAX_LOGS:
        agent_logs.pop()


async def generate_agent_thoughts():
    """Generate agent 'thoughts' based on current venue state."""
    # FlowAgent analysis
    congested = []
    hot_zones = []
    for r, row in enumerate(venue.grid):
        for c, cell in enumerate(row):
            if cell["density"] > 0.7:
                zone = _zone_name(r, c)
                congested.append((zone, cell["density"]))
            if cell["temperature"] > 35:
                hot_zones.append((_zone_name(r, c), cell["temperature"]))

    if congested:
        worst = max(congested, key=lambda x: x[1])
        add_agent_log("FLOW_AGENT",
            f">> BOTTLENECK detected at {worst[0].upper()}. Executing Dynamic Path Divergence.",
            "warning" if worst[1] > 0.85 else "info")

    if hot_zones:
        worst_heat = max(hot_zones, key=lambda x: x[1])
        add_agent_log("FLOW_AGENT",
            f">> THERMAL ANOMALY at {worst_heat[0].upper()}: {worst_heat[1]}°C. Routing via alternative vector.",
            "warning")

    # SyncAgent analysis
    gate_congestion = []
    for cell in venue.get_gate_cells():
        if cell["density"] > 0.75:
            gate_congestion.append(cell)

    if gate_congestion:
        gate = random.choice(gate_congestion)
        gate_name = f"Gate ({gate['row']},{gate['col']})"
        messages = [
            f">> Congestion at {gate_name} detected. Rerouting traffic to alternate corridors.",
            f">> VOUCHER_ID_{random.randint(100, 999)} deployed to {gate_name}. Staggering exit by 480 seconds.",
            f">> DEPLOYING Trivia Protocol at {gate_name}. Expect 300s variance.",
            f">> INCENTIVE EVENT dispatched to {gate_name}. Monitoring footprint.",
            f">> CONGESTION_CRITICAL: {gate_name} at {int(gate['density']*100)}%. Delay incentives ACTIVE.",
        ]
        add_agent_log("SYNC_AGENT", random.choice(messages), "info")
    else:
        if random.random() < 0.3:
            add_agent_log("SYNC_AGENT", ">> SECTOR_GATES nominal. Pre-staging delay incentives.", "info")

    # Guardian analysis
    active_alerts = guardian_agent.get_active_alerts()
    if active_alerts:
        alert = active_alerts[-1]
        messages = [
            f">> ALERT VERIFIED [{alert.x}, {alert.y}]. Coordinating physical intercept.",
            f">> RESPONDER_ID_74 dispatched to {alert.seat_id}. T-minus 90 seconds.",
            f">> EMERGENCY ZONE ACTIVE ({alert.x},{alert.y}). Initiating corridor lockdown.",
        ]
        add_agent_log("GUARDIAN", random.choice(messages), "critical")
    else:
        if random.random() < 0.2:
            add_agent_log("GUARDIAN", ">> SECTORS CLEAR. Passive biometric scanning engaged.", "info")

    # Optional Gemini intel (requires GEMINI_API_KEY and google-generativeai)
    if venue.tick_count > 0 and venue.tick_count % 15 == 0:
        # Calculate stand capacities for Gemini
        stand_densities = {"north": [], "south": [], "east": [], "west": []}
        for r in range(venue.ROWS):
            for c in range(venue.COLS):
                cell = venue.grid[r][c]
                if r <= 2: stand_densities["north"].append(cell["density"])
                elif r >= 7: stand_densities["south"].append(cell["density"])
                elif c <= 2: stand_densities["west"].append(cell["density"])
                else: stand_densities["east"].append(cell["density"])
        
        venue_state = {
            "north": int(sum(stand_densities["north"])/len(stand_densities["north"]) * 100),
            "south": int(sum(stand_densities["south"])/len(stand_densities["south"]) * 100),
            "east": int(sum(stand_densities["east"])/len(stand_densities["east"]) * 100),
            "west": int(sum(stand_densities["west"])/len(stand_densities["west"]) * 100),
            "noise_db": venue.noise_level_db
        }
        insight_result = await get_agent_insight(venue_state)
        if insight_result and insight_result.get("message"):
            add_agent_log(insight_result["agent"], f">> {insight_result['message']}", "info")


def _zone_name(r: int, c: int) -> str:
    """Convert grid coords to stadium zone name."""
    if r <= 2:
        ns = "North"
    elif r >= 7:
        ns = "South"
    else:
        ns = "Central"
    if c <= 3:
        ew = "West"
    elif c >= 6:
        ew = "East"
    else:
        ew = ""
    stand = f"{ns} {ew}".strip() + " Stand"
    return stand


# ── Background Simulator Task ─────────────────────────
async def simulation_loop():
    """Tick the venue every 2 seconds and broadcast state."""
    global latest_incentives
    while True:
        await asyncio.sleep(2)
        venue.tick()

        # Check for gate congestion incentives
        latest_incentives = sync_agent.check_gates()

        # Generate agent thoughts
        await generate_agent_thoughts()

        # Broadcast to all WebSocket clients
        state = _build_venue_payload()
        dead = set()
        for ws in ws_clients:
            try:
                await ws.send_text(json.dumps(state))
            except Exception:
                dead.add(ws)
        ws_clients.difference_update(dead)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the simulation loop on app startup."""
    task = asyncio.create_task(simulation_loop())
    yield
    task.cancel()


# ── FastAPI App ────────────────────────────────────────
app = FastAPI(
    title="VibeSync API",
    description="Agentic AI Stadium Companion",
    version="2.0.0",
    lifespan=lifespan,
)

_cors_origins = os.environ.get("CORS_ORIGINS", "*").strip()
_allow_origins = ["*"] if _cors_origins == "*" else [o.strip() for o in _cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://vibesync-228890906497.europe-west1.run.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helper ─────────────────────────────────────────────
def _build_venue_payload() -> dict:
    grid_data = []
    for row in venue.grid:
        grid_row = []
        for cell in row:
            grid_row.append({
                "row": cell["row"],
                "col": cell["col"],
                "density": cell["density"],
                "temperature": cell["temperature"],
                "cell_type": cell["cell_type"],
                "seat_id": cell["seat_id"],
            })
        grid_data.append(grid_row)

    return {
        "grid": grid_data,
        "tick": venue.tick_count,
        "incentive_events": [e.model_dump() for e in latest_incentives],
        "agent_logs": agent_logs[:15],  # Send latest 15 log entries
        # UPGRADE: Atmosphere Metrics
        "noise_level_db": venue.noise_level_db,
        "air_quality_aqi": venue.air_quality_aqi,
        "wifi_mesh_mbps": venue.wifi_mesh_mbps,
    }


# ── REST Endpoints ─────────────────────────────────────

@app.get("/health")
async def health():
    return {"app": "VibeSync", "status": "running", "tick": venue.tick_count}


@app.get("/venue")
async def get_venue():
    """Return current venue grid state."""
    return _build_venue_payload()


@app.get("/seats")
async def get_seats():
    """Return all valid seat IDs."""
    return {"seats": venue.get_all_seat_ids()}


@app.post("/find-path", response_model=PathResponse)
async def find_path(req: PathRequest):
    """Calculate the Cool Path from a start point to a seat."""
    if req.seat_id.startswith("POI_"):
        poi_map = {"POI_WASHROOM": (0, 9), "POI_WATER": (9, 0), "POI_FOOD": (9, 9)}
        coords = poi_map.get(req.seat_id, (0, 0))
    else:
        coords = venue.get_seat_coords(req.seat_id)
        if coords is None:
            raise HTTPException(status_code=404, detail=f"Seat '{req.seat_id}' not found")

    target_row, target_col = coords
    path, cost = flow_agent.find_cool_path(
        req.start_row, req.start_col, target_row, target_col
    )

    return PathResponse(
        seat_id=req.seat_id.upper(),
        target_row=target_row,
        target_col=target_col,
        path=path,
        total_cost=cost,
    )


@app.post("/sos", response_model=SOSResponse)
async def sos(req: SOSRequest):
    """Trigger a Guardian SOS alert."""
    result = guardian_agent.handle_sos(req.seat_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Seat '{req.seat_id}' not found")
    add_agent_log("Guardian", f"🚨 SOS ACTIVATED — Seat {req.seat_id.upper()} at ({result.x}, {result.y}). Emergency protocols engaged.", "critical")
    return result


@app.get("/sos/alerts")
async def get_alerts():
    """Return all active (unresolved) SOS alerts for the staff dashboard."""
    return {"alerts": [a.model_dump() for a in guardian_agent.get_active_alerts()]}


@app.post("/sos/resolve/{alert_id}")
async def resolve_alert(alert_id: int):
    """Mark an SOS alert as resolved."""
    success = guardian_agent.resolve_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    add_agent_log("Guardian", f"Alert #{alert_id} resolved. Zone returning to normal ops.", "info")
    return {"status": "resolved", "alert_id": alert_id}


@app.post("/join-queue", response_model=JoinQueueResponse)
async def join_queue(req: JoinQueueRequest):
    """Join the Line-Buddy queue."""
    return line_buddy.join_queue(req)


@app.get("/queue-stats")
async def queue_stats():
    """Return current Line-Buddy queue statistics."""
    return line_buddy.get_queue_stats()


@app.post("/api/chat", response_model=ChatResponse)
async def chat_api(req: ChatRequest):
    """Conversational AI for attendees (Legacy endpoint updated)."""
    reply = await get_concierge_response(req.message, req.context)
    return ChatResponse(reply=reply or "I'm offline right now, but standard ops are nominal!")

@app.post("/concierge")
async def concierge(data: ConciergeMessage):
    response = await get_concierge_response(
        data.message, 
        data.venue_state,
        history=data.history
    )
    return {"response": response}

@app.post("/agent-insight")  
async def agent_insight(data: AgentInsightRequest):
    result = await get_agent_insight(
        data.venue_state,
        data.event_type
    )
    return result


@app.post("/stadium-update")
async def stadium_update_api(data: StadiumUpdateRequest):
    result = await get_stadium_update(
        data.venue_state,
        data.last_event,
        data.history,
        data.last_category
    )
    return result


# ── Scenario Injection Endpoints ───────────────────────

@app.post("/scenario/full-surge")
async def scenario_full_surge():
    """Simulate a match ending — full crowd surge to exits."""
    venue.apply_full_surge()
    add_agent_log("FLOW_AGENT", ">> SURGE DETECTED. Core exits at 100%. Dynamic load balancing active.", "critical")
    add_agent_log("SYNC_AGENT", ">> OVERRIDE: Deploying mass trivia challenges to all exit vectors.", "critical")
    add_agent_log("GUARDIAN", ">> CRUSH PROTOCOL ENGAGED. Monitoring sector pressures.", "warning")
    return {"status": "applied", "scenario": "full_surge"}


@app.post("/scenario/medical-priority-one")
async def scenario_medical_priority():
    """Simulate a medical priority one at seat E4."""
    venue.apply_medical_priority("E4")
    sos_result = guardian_agent.handle_sos("E4")
    add_agent_log("GUARDIAN", ">> MEDICAL PRIORITY ONE — SEC_E4. Critical density anomaly. Dispatching trauma element.", "critical")
    add_agent_log("FLOW_AGENT", ">> REROUTING CORE C2. Establishing secure corridor through Central Axis.", "critical")
    add_agent_log("SYNC_AGENT", ">> INCENTIVES SUSPENDED. Priority mode active.", "warning")
    return {"status": "applied", "scenario": "medical_priority_one", "sos": sos_result.model_dump() if sos_result else None}


@app.post("/scenario/power-outage")
async def scenario_power_outage():
    """Simulate a total power outage."""
    venue.apply_power_outage()
    add_agent_log("GUARDIAN", ">> SYSTEM FAILURE: GRID OFFLINE. Triggering fail-safe illumination.", "critical")
    add_agent_log("FLOW_AGENT", ">> MASS BOTTLENECK DETECTED. Executing blackout vector redirection.", "critical")
    return {"status": "applied", "scenario": "power_outage"}


@app.post("/scenario/gate-blockage")
async def scenario_gate_blockage():
    """Simulate a jammed gate at column 3."""
    venue.apply_gate_blockage(gate_col=3)
    add_agent_log("SYNC_AGENT", ">> Congestion at Gate (0,3) detected. Rerouting traffic to Gate East.", "critical")
    add_agent_log("FLOW_AGENT", ">> Gate North jam confirmed. Diverging all inbound vectors via Aisle Row 6.", "warning")
    add_agent_log("GUARDIAN", ">> Checkpoint lockdown at G-0,3. Physical intercept dispatched.", "warning")
    return {"status": "applied", "scenario": "gate_blockage"}


@app.get("/agent-logs")
async def get_agent_logs():
    """Return recent agent log entries."""
    return {"logs": agent_logs[:30]}


# ── WebSocket ──────────────────────────────────────────

@app.websocket("/ws/venue")
async def venue_ws(websocket: WebSocket):
    """Real-time venue state stream."""
    await websocket.accept()
    ws_clients.add(websocket)

    # Send initial state immediately
    try:
        await websocket.send_text(json.dumps(_build_venue_payload()))
    except Exception:
        ws_clients.discard(websocket)
        return

    try:
        while True:
            # Keep connection alive; client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_clients.discard(websocket)


# ── Static frontend (Docker / Cloud Run) ───────────────
DIST_DIR = os.environ.get("STATIC_DIST", "").strip()

if DIST_DIR and os.path.isdir(DIST_DIR):
    from fastapi.responses import FileResponse

    @app.get("/")
    async def root():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        candidate = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:

    @app.get("/")
    async def root():
        return {"app": "VibeSync", "status": "running", "tick": venue.tick_count}


# ── Run ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
