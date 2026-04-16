"""
VibeSync — Agentic AI Stadium Companion
FastAPI backend: routes, WebSocket, background simulation, and scenario injection.
"""

import asyncio
import json
import random
from datetime import datetime, timezone
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

# Agent log messages
agent_logs: list[dict] = []
MAX_LOGS = 50


def add_agent_log(agent: str, message: str, level: str = "info"):
    """Add a log entry from an agent."""
    agent_logs.insert(0, {
        "agent": agent,
        "message": message,
        "level": level,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    if len(agent_logs) > MAX_LOGS:
        agent_logs.pop()


def generate_agent_thoughts():
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
        add_agent_log("FlowAgent",
            f"Detected {int(worst[1]*100)}% congestion in {worst[0]}. Recalculating optimal pathing corridors...",
            "warning" if worst[1] > 0.85 else "info")

    if hot_zones:
        worst_heat = max(hot_zones, key=lambda x: x[1])
        add_agent_log("FlowAgent",
            f"Thermal anomaly at {worst_heat[0]}: {worst_heat[1]}°C. Routing fans through cooler corridors.",
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
            f"Triggering merch vouchers for {gate_name} to stagger exits.",
            f"Deploying trivia challenge at {gate_name}. Expected delay: 3-5 min.",
            f"Incentive event dispatched near {gate_name}. Monitoring crowd response...",
            f"Exit congestion at {gate_name}: {int(gate['density']*100)}%. Activating delay incentives.",
        ]
        add_agent_log("SyncAgent", random.choice(messages), "info")
    else:
        if random.random() < 0.3:
            add_agent_log("SyncAgent", "All gates nominal. Pre-staging incentives for post-event surge.", "info")

    # Guardian analysis
    active_alerts = guardian_agent.get_active_alerts()
    if active_alerts:
        alert = active_alerts[-1]
        messages = [
            f"SOS verified at [{alert.x}, {alert.y}]. Coordinating medic intercept.",
            f"Staff dispatched to seat {alert.seat_id}. ETA: 90 seconds. Monitoring zone clearance.",
            f"Emergency response active at ({alert.x},{alert.y}). Clearing adjacent corridors.",
        ]
        add_agent_log("Guardian", random.choice(messages), "critical")
    else:
        if random.random() < 0.2:
            add_agent_log("Guardian", "All sectors clear. Passive biometric monitoring active.", "info")


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
        generate_agent_thoughts()

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
    version="2.0.0",
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
        "agent_logs": agent_logs[:15],  # Send latest 15 log entries
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


# ── Scenario Injection Endpoints ───────────────────────

@app.post("/scenario/full-surge")
async def scenario_full_surge():
    """Simulate a match ending — full crowd surge to exits."""
    venue.apply_full_surge()
    add_agent_log("FlowAgent", "⚠️ FULL SURGE DETECTED — Match has ended. All exits experiencing critical congestion. Activating emergency corridor routing.", "critical")
    add_agent_log("SyncAgent", "🎯 Mass incentive deployment — Trivia challenges and delay vouchers dispatched to ALL gates.", "critical")
    add_agent_log("Guardian", "🔒 Full surge protocol active. All medic teams on standby. Monitoring for crowd crush indicators.", "warning")
    return {"status": "applied", "scenario": "full_surge"}


@app.post("/scenario/medical-emergency")
async def scenario_medical():
    """Simulate a medical emergency at seat E4."""
    venue.apply_medical_emergency("E4")
    sos_result = guardian_agent.handle_sos("E4")
    add_agent_log("Guardian", "🚨 MEDICAL EMERGENCY — Seat E4 sector. Crowd density spike detected around incident zone. Dispatching medic team.", "critical")
    add_agent_log("FlowAgent", "Re-routing all pathing away from E4 sector. Creating emergency access corridor through Central Stand.", "critical")
    add_agent_log("SyncAgent", "Freezing incentive events in affected zone. Priority clearance mode active.", "warning")
    return {"status": "applied", "scenario": "medical_emergency", "sos": sos_result.model_dump() if sos_result else None}


@app.post("/scenario/gate-blockage")
async def scenario_gate_blockage():
    """Simulate Gate 3 blockage."""
    venue.apply_gate_blockage(3)
    add_agent_log("FlowAgent", "🚧 GATE 3 BLOCKAGE — Column 3 completely jammed. Redirecting all foot traffic to Gates 5-9. Estimated clearance: 8 minutes.", "critical")
    add_agent_log("SyncAgent", "Deploying heavy incentives at Gate 3. BOGO drinks and exclusive merch discounts activated to hold crowd.", "warning")
    add_agent_log("Guardian", "Security team deployed to Gate 3. Monitoring for crowd pressure escalation.", "warning")
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


# ── Run ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
