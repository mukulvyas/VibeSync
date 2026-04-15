"""
SyncAgent — Gate congestion monitor & incentive generator.

When any gate cell density exceeds 0.8, generates an Incentive Event
containing a trivia question and reward voucher to encourage staggered exit.
"""

import random
from datetime import datetime, timezone
from venue import VenueSimulator
from models import IncentiveEvent

TRIVIA_POOL = [
    "Who scored the fastest hat-trick in World Cup history?",
    "Which stadium is known as 'The Theatre of Dreams'?",
    "How many players are on a standard football team?",
    "Which country has won the most FIFA World Cups?",
    "What year were red cards introduced in football?",
    "Who holds the record for most Olympic gold medals?",
    "What sport is played at Wimbledon?",
    "Which NBA team has won the most championships?",
    "What is the diameter of a basketball hoop in inches?",
    "How long is an Olympic swimming pool in meters?",
    "Who was the youngest player to score in a World Cup final?",
    "What is the maximum break in snooker?",
]

REWARDS_POOL = [
    "15% off merch at Stand B",
    "Free nachos at Concourse C",
    "Buy-one-get-one drinks at Bar 7",
    "Priority re-entry pass — Gate 2",
    "20% off team jersey at the Fan Shop",
    "$5 food voucher at Stand A",
    "Free popcorn at Concourse D",
    "Exclusive digital trading card unlock",
]


class SyncAgent:
    def __init__(self, venue: VenueSimulator):
        self.venue = venue

    def check_gates(self) -> list[IncentiveEvent]:
        """Scan all gate cells. Generate incentives for congested gates."""
        events = []
        gate_cells = self.venue.get_gate_cells()

        for cell in gate_cells:
            if cell["density"] > 0.8:
                gate_label = f"G-{cell['row']},{cell['col']}"
                event = IncentiveEvent(
                    type="incentive",
                    gate_id=gate_label,
                    gate_row=cell["row"],
                    gate_col=cell["col"],
                    trivia=random.choice(TRIVIA_POOL),
                    reward=random.choice(REWARDS_POOL),
                    delay_suggestion_minutes=random.randint(3, 8),
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )
                events.append(event)

        return events
