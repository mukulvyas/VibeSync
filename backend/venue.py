"""
Venue Simulator — 10×10 grid-based stadium model.

Layout:
  - Row 0 & 9: gate cells (entrances/exits)
  - Row 1-8, Col 0 & 9: aisle cells
  - Interior (rows 1-8, cols 1-8): seat cells

Each cell tracks density (0.0–1.0) and temperature (°C).
"""

import random
import string
from models import CellState


class VenueSimulator:
    ROWS = 10
    COLS = 10

    def __init__(self):
        self.tick_count = 0
        self.grid: list[list[dict]] = []
        self.seat_map: dict[str, tuple[int, int]] = {}
        self._build_grid()

    # ── Grid Construction ──────────────────────────────
    def _build_grid(self):
        seat_counter = 0
        seat_rows = "ABCDEFGH"

        for r in range(self.ROWS):
            row = []
            for c in range(self.COLS):
                cell_type = self._get_cell_type(r, c)
                seat_id = None

                if cell_type == "seat":
                    seat_letter = seat_rows[r - 1]  # rows 1-8 → A-H
                    seat_num = c  # cols 1-8
                    seat_id = f"{seat_letter}{seat_num}"
                    self.seat_map[seat_id] = (r, c)
                    seat_counter += 1

                cell = {
                    "row": r,
                    "col": c,
                    "density": round(random.uniform(0.05, 0.35), 2),
                    "temperature": round(random.uniform(22.0, 30.0), 1),
                    "cell_type": cell_type,
                    "seat_id": seat_id,
                }
                row.append(cell)
            self.grid.append(row)

        # Gates get higher initial density
        for r, c in self._gate_cells():
            self.grid[r][c]["density"] = round(random.uniform(0.4, 0.7), 2)

    def _get_cell_type(self, r: int, c: int) -> str:
        if r == 0 or r == self.ROWS - 1:
            return "gate"
        if c == 0 or c == self.COLS - 1:
            return "aisle"
        return "seat"

    def _gate_cells(self) -> list[tuple[int, int]]:
        gates = []
        for c in range(self.COLS):
            gates.append((0, c))
            gates.append((self.ROWS - 1, c))
        return gates

    # ── Simulation Tick ────────────────────────────────
    def tick(self):
        """Advance the simulation by one step — shift density and temperature."""
        self.tick_count += 1

        for r in range(self.ROWS):
            for c in range(self.COLS):
                cell = self.grid[r][c]
                # Random density drift
                drift = random.uniform(-0.08, 0.08)
                cell["density"] = round(
                    max(0.0, min(1.0, cell["density"] + drift)), 2
                )
                # Slight temperature shift correlated with density
                temp_drift = random.uniform(-0.5, 0.5) + cell["density"] * 0.3
                cell["temperature"] = round(
                    max(18.0, min(42.0, cell["temperature"] + temp_drift)), 1
                )

        # Gates tend to get crowded (simulate exit rushes)
        if self.tick_count % 5 == 0:
            for r, c in self._gate_cells():
                surge = random.uniform(0.05, 0.2)
                self.grid[r][c]["density"] = round(
                    min(1.0, self.grid[r][c]["density"] + surge), 2
                )

    # ── Accessors ──────────────────────────────────────
    def get_state(self) -> list[list[CellState]]:
        return [
            [CellState(**cell) for cell in row]
            for row in self.grid
        ]

    def get_cell(self, r: int, c: int) -> dict:
        return self.grid[r][c]

    def get_seat_coords(self, seat_id: str) -> tuple[int, int] | None:
        return self.seat_map.get(seat_id.upper())

    def get_gate_cells(self) -> list[dict]:
        return [self.grid[r][c] for r, c in self._gate_cells()]

    def get_all_seat_ids(self) -> list[str]:
        return sorted(self.seat_map.keys())

    # ── Scenario Injection ─────────────────────────────
    def apply_full_surge(self):
        """Match Ends — all gates and aisles surge to max density."""
        for r in range(self.ROWS):
            for c in range(self.COLS):
                cell = self.grid[r][c]
                if cell["cell_type"] == "gate":
                    cell["density"] = round(random.uniform(0.85, 1.0), 2)
                    cell["temperature"] = round(random.uniform(36.0, 42.0), 1)
                elif cell["cell_type"] == "aisle":
                    cell["density"] = round(random.uniform(0.7, 0.95), 2)
                    cell["temperature"] = round(random.uniform(33.0, 38.0), 1)
                else:
                    cell["density"] = round(random.uniform(0.5, 0.85), 2)
                    cell["temperature"] = round(random.uniform(30.0, 36.0), 1)

    def apply_medical_emergency(self, seat_id: str = "E4"):
        """Medical emergency — spike density around a seat."""
        coords = self.get_seat_coords(seat_id)
        if not coords:
            coords = (5, 4)
        r0, c0 = coords
        for dr in range(-2, 3):
            for dc in range(-2, 3):
                r, c = r0 + dr, c0 + dc
                if 0 <= r < self.ROWS and 0 <= c < self.COLS:
                    dist = abs(dr) + abs(dc)
                    spike = max(0.0, 0.95 - dist * 0.15)
                    self.grid[r][c]["density"] = round(max(self.grid[r][c]["density"], spike), 2)
                    self.grid[r][c]["temperature"] = round(min(42.0, self.grid[r][c]["temperature"] + 4.0), 1)

    def apply_gate_blockage(self, gate_col: int = 3):
        """Gate blockage — specific gate column completely jammed."""
        # Block the gate cells in that column
        for r in [0, self.ROWS - 1]:
            self.grid[r][gate_col]["density"] = 1.0
            self.grid[r][gate_col]["temperature"] = 42.0
        # Cascade congestion to nearby cells
        for r in range(1, self.ROWS - 1):
            for dc in range(-1, 2):
                c = gate_col + dc
                if 0 <= c < self.COLS:
                    self.grid[r][c]["density"] = round(min(1.0, self.grid[r][c]["density"] + 0.4), 2)
                    self.grid[r][c]["temperature"] = round(min(42.0, self.grid[r][c]["temperature"] + 3.0), 1)
