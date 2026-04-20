import pytest
from venue import VenueSimulator
from agents.flow_agent import FlowAgent
from agents.sync_agent import SyncAgent
from agents.guardian_agent import GuardianAgent
from models import SOSRequest

@pytest.fixture
def venue():
    return VenueSimulator()

def test_flow_agent_pathfinding(venue):
    agent = FlowAgent(venue)
    # Test path from Gate (0,0) to Aisle (5,0)
    path, cost = agent.find_cool_path(0, 0, 5, 0)
    assert len(path) > 0
    assert cost > 0
    assert path[0].row == 0
    assert path[0].col == 0
    assert path[-1].row == 5
    assert path[-1].col == 0

def test_sync_agent_check_gates(venue):
    agent = SyncAgent(venue)
    # Initially gates might not be congested
    events = agent.check_gates()
    
    # Force congestion at gate (0,0)
    venue.grid[0][0]["density"] = 0.9
    events = agent.check_gates()
    assert len(events) >= 1
    assert events[0].gate_id == "G-0,0"
    assert events[0].trivia is not None

def test_guardian_agent_sos(venue):
    flow = FlowAgent(venue)
    agent = GuardianAgent(venue)
    agent.set_flow_agent(flow)
    
    # Test SOS for valid seat
    response = agent.handle_sos("N13")
    assert response is not None
    assert response.seat_id == "N13"
    assert len(agent.get_active_alerts()) == 1
    
    # Resolve alert
    alert_id = agent.get_active_alerts()[0].id
    assert agent.resolve_alert(alert_id) is True
    assert len(agent.get_active_alerts()) == 0

def test_guardian_agent_invalid_seat(venue):
    agent = GuardianAgent(venue)
    response = agent.handle_sos("ZZ99")
    assert response is None
