"""
VibeSync — Agentic AI Stadium Companion
FastAPI backend: routes, WebSocket, and background simulation.
"""

import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    PathRequest, PathResponse, SOSRequest, SOSResponse,
    JoinQueueRequest, JoinQueueResponse, VenueState, StaffAlert,
)
from venue import VenueSimulator
from agents.flow_agent import FlowAgent
from agents.sync_agent import SyncAgent
from agents.guardian_agent import GuardianAgent
from line_buddy import LineBuddy

# ── Global State ───────────────────────────────────────
venue = VenueSimulator()
flow_agent = FlowAgent(venue)
sync_agent = SyncAgent(venue)
guardian_agent = GuardianAgent(venue)
line_buddy = LineBuddy()

# Connected WebSocket clients
ws_clients: set[WebSocket] = set()

# Latest incentive events (cleared each tick)
latest_incentives = []


# ── Background Simulator Task ─────────────────────────
async def simulation_loop():
    """Tick the venue every 2 seconds and broadcast state."""
    global latest_incentives
    while True:
        await asyncio.sleep(2)
        venue.tick()

        # Check for gate congestion incentives
        latest_incentives = sync_agent.check_gates()

        # Broadcast to all WebSocket clients
        state = _build_venue_payload()
        dead = set()
        for ws in ws_clients:
            try:
                await ws.send_text(json.dumps(state))
            except Exception:
                dead.add(ws)
        ws_clients -= dead


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
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    }


# ── REST Endpoints ─────────────────────────────────────

@app.get("/")
async def root():
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
    return {"status": "resolved", "alert_id": alert_id}


@app.post("/join-queue", response_model=JoinQueueResponse)
async def join_queue(req: JoinQueueRequest):
    """Join the Line-Buddy queue."""
    return line_buddy.join_queue(req)


@app.get("/queue-stats")
async def queue_stats():
    """Return current Line-Buddy queue statistics."""
    return line_buddy.get_queue_stats()


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


# ── Run ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
