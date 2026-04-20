# VibeSync — Agentic AI Stadium Companion 🏏

**VibeSync** is a real-time AI system for large-scale cricket stadiums.  
It gives fans a smart companion app and ops teams a live command center — both powered by the same live match simulation engine and Google Gemini AI.

---

## 🎯 The Problem

At a packed cricket stadium, fans waste 15+ minutes finding exits, washrooms, and food. Ops teams react too late — after bottlenecks already form, not before.

**VibeSync prevents this** with congestion-aware pathfinding, real-time crowd telemetry, AI-driven routing, and a one-tap Medical SOS system.

---

## ⚡ Live Demo

| View | URL |
|---|---|
| 🟢 Attendee App | `http://localhost:5173/` |
| 🔵 Ops Command | `http://localhost:5173/ops` |

### Demo

1. Open **User view** → tap the 🎫 **Entry Route** card → see AI-generated directions from the entry gate to your randomised seat, with a bypass route if the primary gate is congested
2. Tap 🚨 **Medical Assistance** → ops dashboard (switch to `/ops`) shows a live critical alert — resolve it → attendee view updates to "Assistance Complete" in real time
3. Switch to **Ops view** → click **⚡ Run Scenario** → select **Full House**
4. Watch the heatmap surge red, capacity alerts fire, and agents log responses
5. Click **Resolve** on a critical alert → agent log closes the loop automatically
6. Open the ✦ **AI Concierge** (floating button) → ask "where is the washroom?" or "which gate should I use?" →  AI answers with venue-aware context

---

## 🖥️ Dual Interface

| Attendee App | Ops Command |
|---|---|
| Live IND vs AUS score + match clock | Real-time crowd heatmap (toggle on/off) |
| Randomised seat assignment (per session) | Predictive stand capacity analytics |
| Entry Route with congestion bypass logic | Multi-agent intel stream (Flow/Sync/Guardian) |
| Exit Route with least-busy gate AI routing | One-click scenario controls |
| Medical SOS → Ops alert → resolved status | Critical alert workflow with resolution |
| Live atmosphere (noise dB, AQI, WiFi Mbps) | AI Operational Insight with confidence score |
| AI Concierge chat | Scenario-driven stress testing |
| Stadium Updates feed | WebSocket live venue state stream |

---

## 🚑 Medical SOS System

A complete end-to-end safety loop:

1. **Attendee** taps the red **Medical Assistance** button on the Home tab
2. A yellow pulsing **"Team Dispatched"** status replaces the button
3. A **"Medical Emergency · Critical"** alert fires instantly on the **Ops dashboard** with the attendee's stand, row, and seat
4. **Ops staff** resolves the alert via the dashboard
5. Attendee view **automatically updates** to a green **"Assistance Complete"** notification

---

## 🗺️ AI Navigation System

### Entry Route (Gate → Seat)
- Checks the **primary gate capacity** for the attendee's assigned stand
- If **> 85% congested** → suggests a **bypass route via an alternate gate** with inner concourse directions
- If clear → provides fast **direct route** with step-by-step landmark cues
- All routes reference the **actual randomised seat** (Row X, Seat Y, Gate XX)

### Exit Route (Seat → Gate)
- Ranks all four gates by **live crowd density**
- Guides through the **lowest-load exit** with turn-by-turn directions

### POI Navigation (Food / Washroom / Hydration)
- All routes are **crowd-aware**, referencing live stand capacities
- Directions use real venue landmark cues

---

## ⚡ Scenario Simulation

Ops teams can run instant what-if scenarios:

| Scenario | What Happens |
|---|---|
| 🏟️ **Full House** | All stands surge to 95%+, critical alerts fire, agents redirect crowds |
| ⚡ **Wicket Storm** | 3 rapid wickets trigger crowd spikes and gate pressure |
| 🌧️ **Rain Delay** | Sudden dispersal protocol, weather coordination messaging |
| 🏆 **Match Over** | Exit routing optimisation, full crowd wind-down sequence |

---

## 🤖 AI Agents

| Agent | Role |
|---|---|
| **Sync Agent** | Monitors gate congestion, dispatches trivia/voucher incentives to stagger exits |
| **Guardian Agent** | Handles SOS alerts, dispatches responders, manages emergency corridor lockdowns |
| **Gemini Concierge** | Multi-turn AI chat giving crowd-aware answers to attendee queries |
| **Gemini Ops Insight** | Real-time tactical intelligence for Ops dashboard with confidence scoring |
| **Gemini Stadium Updates** | Context-aware, category-rotating updates pushed to the attendee Alerts tab |

---

## 📁 Project Structure

```text
VibeSync/
├── Dockerfile
├── backend/
│   ├── main.py              # FastAPI app, WebSocket, scenario endpoints
│   ├── venue.py             # Venue grid + ball-by-ball simulation core
│   ├── models.py            # Pydantic request/response contracts
│   ├── line_buddy.py        # Fan queue matching
│   ├── requirements.txt
│   ├── tests/
│   │   └── test_api.py      # Smoke tests (health, pathfinding, SOS, queue)
│   └── agents/
│       ├── flow_agent.py    # A* pathfinding engine
│       ├── sync_agent.py    # Gate congestion + incentive dispatch
│       ├── guardian_agent.py# SOS alert management
│       └── gemini_agent.py  # Concierge, Ops Insight, Stadium Updates
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx                      # Root state + routing + seat randomisation
        ├── App.test.jsx                 # Vitest integration tests
        ├── hooks/
        │   ├── useMatchSimulation.jsx   # Central live match state engine
        │   └── useVenueData.js          # WebSocket venue data hook
        ├── utils/
        │   ├── api.js                   # Typed fetch wrappers for all endpoints
        │   └── config.js                # API base URL config
        └── components/
            ├── AttendeeShell.jsx        # Attendee mobile layout + Medical SOS UI
            ├── AttendeeFocus.jsx        # Entry/Exit route + POI navigation cards
            ├── AIInsightDrawer.jsx      # AI Concierge chat + Ops insight drawer
            ├── OpsDashboard.jsx         # Ops command center layout
            ├── VibeMap.jsx              # Live SVG stadium heatmap
            ├── AgentLog.jsx             # Multi-agent intel stream
            ├── AtmosphereMetrics.jsx    # Noise / AQI / WiFi live metrics
            └── StadiumUpdates.jsx       # Gemini-powered attendee updates feed
```

---

## 🚀 Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))

### Backend

```bash
cd backend

# Create .env from template
cp .env.example .env
# Add your key: GEMINI_API_KEY=your_key_here

pip install -r requirements.txt
python main.py
# API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

### Run Tests

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm run test
```

---

## 🌐 Deploy to Cloud Run

```bash
# Build and push image
docker build -t vibesync .
docker tag vibesync gcr.io/YOUR_PROJECT/vibesync
docker push gcr.io/YOUR_PROJECT/vibesync

# Deploy
gcloud run deploy vibesync \
  --image gcr.io/YOUR_PROJECT/vibesync \
  --set-env-vars GEMINI_API_KEY=your_key,STATIC_DIST=/app/dist \
  --region europe-west1 \
  --allow-unauthenticated
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
