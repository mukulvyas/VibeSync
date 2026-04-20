import pytest
import json
from venue import VenueSimulator
from agents.flow_agent import FlowAgent
from agents.guardian_agent import GuardianAgent

@pytest.fixture
def venue():
    return VenueSimulator()

def test_flow_agent_same_cell(venue):
    """Test pathfinding when start and end are the same (at a valid aisle)."""
    agent = FlowAgent(venue)
    path, cost = agent.find_cool_path(0, 5, 0, 5)
    assert len(path) == 1
    assert path[0].row == 0
    assert path[0].col == 5
    assert cost > 0

def test_flow_agent_boundary_coordinates(venue):
    """Test pathfinding with coordinates at the very edge of the grid."""
    agent = FlowAgent(venue)
    path, cost = agent.find_cool_path(0, 0, 9, 9)
    assert len(path) >= 2
    assert path[0].row == 0 and path[0].col == 0
    assert path[-1].row == 9 and path[-1].col == 9

def test_venue_max_density_tick(venue):
    """Test that ticking the venue with max density cells maintains bounds."""
    for r in range(venue.ROWS):
        for c in range(venue.COLS):
            venue.grid[r][c]["density"] = 1.0
    
    venue.tick()
    
    for r in range(venue.ROWS):
        for c in range(venue.COLS):
            assert 0.0 <= venue.grid[r][c]["density"] <= 1.0
            assert 18.0 <= venue.grid[r][c]["temperature"] <= 42.0

def test_guardian_rapid_sos(venue):
    """Stress test the SOS system with rapid-fire alerts using valid seat IDs."""
    agent = GuardianAgent(venue)
    # N13 is r=1, c=3; S73 is r=7, c=3; W31 is r=3, c=1; E37 is r=3, c=7
    valid_seats = ["N13", "N14", "S73", "S74", "W31", "W32", "E37", "E38"]
    for i in range(100):
        seat_id = valid_seats[i % len(valid_seats)]
        agent.handle_sos(seat_id)
    
    alerts = agent.get_active_alerts()
    assert len(alerts) == 100
    assert alerts[99].id == 100

def test_venue_serialization(venue):
    """Verify that venue state is JSON serializable and maintains data integrity."""
    state = venue.get_state()
    # Serialize to JSON
    json_state = json.dumps([ [c.model_dump() for c in row] for row in state])
    loaded_state = json.loads(json_state)
    
    assert len(loaded_state) == venue.ROWS
    assert loaded_state[0][0]["cell_type"] == "gate"
