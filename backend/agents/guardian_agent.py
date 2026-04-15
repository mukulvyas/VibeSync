"""
GuardianAgent — SOS emergency handler.

Resolves seat IDs to exact (x, y) coordinates and generates
high-priority Staff Alert payloads.
"""

from datetime import datetime, timezone
from venue import VenueSimulator
from models import SOSResponse, StaffAlert


class GuardianAgent:
    def __init__(self, venue: VenueSimulator):
        self.venue = venue
        self.alerts: list[StaffAlert] = []
        self._alert_counter = 0

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
        )
        self.alerts.append(alert)

        return SOSResponse(
            seat_id=seat_id.upper(),
            x=row,
            y=col,
            alert_level="HIGH",
            message=f"Help is on the way to seat {seat_id.upper()}. Stay calm.",
            timestamp=now,
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
