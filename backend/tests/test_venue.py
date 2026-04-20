import pytest
from venue import VenueSimulator

def test_venue_initialization():
    venue = VenueSimulator()
    assert venue.ROWS == 10
    assert venue.COLS == 10
    assert len(venue.grid) == 10
    assert len(venue.grid[0]) == 10
    assert venue.tick_count == 0
    assert venue.noise_level_db == 72.0

def test_venue_tick():
    venue = VenueSimulator()
    initial_tick = venue.tick_count
    venue.tick()
    assert venue.tick_count == initial_tick + 1
    # Check that atmosphere metrics changed
    assert venue.wifi_mesh_mbps != 940 or venue.air_quality_aqi != 24 or venue.noise_level_db != 72.0

def test_get_seat_coords():
    venue = VenueSimulator()
    # Check a few known seat patterns
    # N13 is likely at row 1, col 3
    coords = venue.get_seat_coords("N13")
    assert coords == (1, 3)
    
    # Non-existent seat
    assert venue.get_seat_coords("Z99") is None

def test_apply_full_surge():
    venue = VenueSimulator()
    venue.apply_full_surge()
    # Gates and concourses should have high density
    for r, c in venue._gate_cells():
        assert venue.grid[r][c]["density"] >= 0.85

def test_apply_medical_priority():
    venue = VenueSimulator()
    seat_id = "N13"
    venue.apply_medical_priority(seat_id)
    r, c = venue.get_seat_coords(seat_id)
    assert venue.grid[r][c]["density"] == 1.0
    assert venue.grid[r][c]["temperature"] >= 27.0 # base (22-30) + 5.0, capped at 42

def test_get_gate_cells():
    venue = VenueSimulator()
    gates = venue.get_gate_cells()
    assert len(gates) == 4
    for gate in gates:
        assert gate["cell_type"] == "gate"
