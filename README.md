# VibeSync — AI Stadium 🏏
**VibeSync is a real-time AI for cricket stadiums.**  
It gives fans a smart companion app and gives ops teams a live command center — both powered by the same live match simulation engine.

---

## 🎯 The Problem
At a packed cricket stadium, fans waste 15+ minutes finding exits, washrooms, and food. Ops teams react too late — after bottlenecks already form, not before.

**VibeSync prevents this.**

---

## ⚡ Live Demo

| View | Link |
|------|------|
| 🟢 Attendee App | `localhost:5173` (User mode) |
| 🔵 Ops Command | `localhost:5173/ops` |

### 60-Second Judge Demo
1. Open **User view** → tap **Start Navigation** → get step-by-step directions to your gate inside the app
2. Switch to **Ops view** → click **⚡ Run Scenario** → select **Full House**
3. Watch the heatmap turn red, alerts fire, and agents respond in real time
4. Click **Resolve** on a critical alert → see it close-the-loop in Agent Intel
5. Run **Rain Delay** → crowd dispersal protocol activates automatically

---

## 🖥️ Dual Interface

| Attendee App | Ops Command |
|---|---|
| Live IND vs AUS score + match clock | Real-time crowd heatmap |
| Nearest gate / washroom / food court | Predictive density analytics |
| In-app step-by-step navigation | Multi-agent intel stream |
| Live atmosphere metrics (noise, air, WiFi) | One-click scenario controls |
| Stand capacity on hover | Critical alert workflow |

---

## ⚡ Scenario Simulation

Ops teams can run instant what-if scenarios:

| Scenario | What Happens |
|---|---|
| 🏟️ **Full House** | All stands surge to 95%+, critical alerts fire, agents redirect crowds |
| ⚡ **Wicket Storm** | 3 rapid wickets trigger crowd spikes and gate pressure |
| 🌧️ **Rain Delay** | Sudden dispersal protocol, weather coordination messaging |
| 🏆 **Match Over** | Exit routing optimization, full crowd wind-down sequence |

---

## 🗺️ Navigation That Actually Works
- User's stand position (SEC-SOUTH) determines nearest gate automatically
- **Start Navigation** gives step-by-step in-app directions from your seat to the exit
- Directions use real landmark cues — "Turn left at the concourse, follow signs to Gate S2"
- Route is crowd-aware — avoids congested stands, suggests least-busy path
- Covers exit gates, washrooms, food courts, and hydration stations
- No app-switching needed — everything stays inside VibeSync

---

## 🏗️ Tech Stack
- **Frontend:** React + Vite, `useMatchSimulation` context hook for shared live state
- **Backend:** FastAPI, WebSocket venue stream (`/ws/venue`), A* pathfinding engine
- **Navigation:** In-app crowd-aware routing with landmark-based directions
- **Simulation:** Ball-by-ball cricket match engine driving all UI state in real time

---

## 📁 Project Structure

```text
VibeSync/
  backend/
    main.py              # FastAPI app + WebSocket
    venue.py             # Venue grid + simulation core
    models.py            # Typed contracts
    line_buddy.py        # Queue matching
    agents/
      flow_agent.py
      sync_agent.py
      guardian_agent.py
  frontend/
    src/
      App.jsx
      hooks/
        useMatchSimulation.jsx   # Central live state engine
        useVenueData.js
      components/
        VibeMap.jsx              # Heatmap + stand interaction
        AgentLog.jsx             # Intel stream
        AttendeeFocus.jsx        # Fan-facing actions
        AIInsightDrawer.jsx
        AtmosphereMetrics.jsx
```

---

## 🚀 Run Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs at http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```
