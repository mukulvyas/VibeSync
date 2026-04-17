"""
FlowAgent — A* pathfinding for the "Cool Path".

Calculates the lowest-cost path through the venue grid,
where cost = density * 5 + temperature * 0.1 + 1.0 (base move).
"""

import heapq
from venue import VenueSimulator
from models import PathStep


class FlowAgent:
    def __init__(self, venue: VenueSimulator):
        self.venue = venue

    def find_cool_path(
        self, start_row: int, start_col: int, target_row: int, target_col: int
    ) -> tuple[list[PathStep], float]:
        """
        A* search from (start_row, start_col) to (target_row, target_col).
        Returns (path, total_cost).
        """
        rows, cols = self.venue.ROWS, self.venue.COLS

        valid_types = ("aisle", "concourse", "gate")

        target_cell = self.venue.get_cell(target_row, target_col)
        if target_cell["cell_type"] not in valid_types:
            best_r, best_c, min_dist = target_row, target_col, float('inf')
            for r in range(rows):
                for c in range(cols):
                    cell = self.venue.get_cell(r, c)
                    if cell["cell_type"] in valid_types:
                        dist = abs(r - target_row) + abs(c - target_col)
                        if dist < min_dist:
                            min_dist = dist
                            best_r, best_c = r, c
            target_row, target_col = best_r, best_c

        # Also map start_row/start_col to nearest valid terrain
        start_cell = self.venue.get_cell(start_row, start_col)
        if start_cell["cell_type"] not in valid_types:
            best_sr, best_sc, min_sdist = start_row, start_col, float('inf')
            for r in range(rows):
                for c in range(cols):
                    cell = self.venue.get_cell(r, c)
                    if cell["cell_type"] in valid_types:
                        sdist = abs(r - start_row) + abs(c - start_col)
                        if sdist < min_sdist:
                            min_sdist = sdist
                            best_sr, best_sc = r, c
            start_row, start_col = best_sr, best_sc

        # Priority queue: (f_score, counter, row, col)
        counter = 0
        open_set = []
        heapq.heappush(open_set, (0, counter, start_row, start_col))

        came_from: dict[tuple[int, int], tuple[int, int] | None] = {
            (start_row, start_col): None
        }
        g_score: dict[tuple[int, int], float] = {(start_row, start_col): 0.0}

        while open_set:
            f, _, r, c = heapq.heappop(open_set)

            if (r, c) == (target_row, target_col):
                return self._reconstruct(came_from, (target_row, target_col))

            for nr, nc in self._neighbors(r, c, rows, cols):
                cell = self.venue.get_cell(nr, nc)
                
                # Enforce Sovereign Layout Rules (Aisles only)
                if cell["cell_type"] not in valid_types:
                    move_cost = float('inf')
                else:
                    move_cost = cell["density"] * 5.0 + cell["temperature"] * 0.1 + 1.0

                if move_cost == float('inf'):
                    continue
                
                tentative_g = g_score[(r, c)] + move_cost

                if (nr, nc) not in g_score or tentative_g < g_score[(nr, nc)]:
                    g_score[(nr, nc)] = tentative_g
                    f_score = tentative_g + self._heuristic(nr, nc, target_row, target_col)
                    counter += 1
                    heapq.heappush(open_set, (f_score, counter, nr, nc))
                    came_from[(nr, nc)] = (r, c)

        # No path found — return direct line (fallback)
        return [PathStep(row=target_row, col=target_col, density=0)], 999.0

    def _neighbors(self, r: int, c: int, rows: int, cols: int):
        """4-directional neighbors."""
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                yield nr, nc

    def _heuristic(self, r1: int, c1: int, r2: int, c2: int) -> float:
        """Manhattan distance heuristic."""
        return abs(r1 - r2) + abs(c1 - c2)

    def _reconstruct(
        self, came_from: dict, current: tuple[int, int]
    ) -> tuple[list[PathStep], float]:
        """Rebuild path from came_from map."""
        path = []
        total_cost = 0.0
        node = current

        while node is not None:
            r, c = node
            cell = self.venue.get_cell(r, c)
            path.append(
                PathStep(row=r, col=c, density=cell["density"])
            )
            total_cost += cell["density"] * 5.0 + cell["temperature"] * 0.1 + 1.0
            node = came_from.get(node)

        path.reverse()
        return path, round(total_cost, 2)
