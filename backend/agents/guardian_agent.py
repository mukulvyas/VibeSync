"""
GuardianAgent — SOS emergency handler.

Resolves seat IDs to exact (x, y) coordinates and generates
high-priority Staff Alert payloads.
"""

from datetime import datetime, timezone
from venue import VenueSimulator
from models import SOSResponse, StaffAlert
from agents.flow_agent import FlowAgent


class GuardianAgent:
    def __init__(self, venue: VenueSimulator):
        self.venue = venue
        self.alerts: list[StaffAlert] = []
        self._alert_counter = 0
        self.flow_agent = None

    def set_flow_agent(self, flow_agent: FlowAgent):
        self.flow_agent = flow_agent

    def handle_sos(self, seat_id: str) -> SOSResponse | None:
        """
        Process an SOS request for a given seat ID.
        Returns SOSResponse with coordinates, or None if seat not found.
        """
        coords = self.venue.get_seat_coords(seat_id)
        if coords is None:
            return None

        row, col = coords
        now = datetime.now(timezone.utc).isoformat()

        # Find fastest path from any gate
        path = None
        if self.flow_agent:
            # We'll just default to dispatching from 0,4 (concourse entry) or just a Gate
            gates = self.venue.get_gate_cells()
            best_path = None
            best_cost = float('inf')
            for g in gates:
                p, c = self.flow_agent.find_cool_path(g["row"], g["col"], row, col)
                if c < best_cost:
                    best_cost = c
                    best_path = p
            path = best_path

        # Create staff alert
        self._alert_counter += 1
        alert = StaffAlert(
            id=self._alert_counter,
            seat_id=seat_id.upper(),
            x=row,
            y=col,
            alert_level="HIGH",
            message=f"🚨 EMERGENCY — Staff dispatched to seat {seat_id.upper()} at ({row}, {col})",
            timestamp=now,
            resolved=False,
            path=path,
        )
        self.alerts.append(alert)

        return SOSResponse(
            seat_id=seat_id.upper(),
            x=row,
            y=col,
            alert_level="HIGH",
            message=f"Help is on the way to seat {seat_id.upper()}. Stay calm.",
            timestamp=now,
            path=path,
        )

    def get_active_alerts(self) -> list[StaffAlert]:
        """Return all unresolved alerts."""
        return [a for a in self.alerts if not a.resolved]

    def resolve_alert(self, alert_id: int) -> bool:
        """Mark an alert as resolved."""
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.resolved = True
                return True
        return False
