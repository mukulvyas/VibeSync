"""Pydantic models for VibeSync API."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Venue ──────────────────────────────────────────────
class CellState(BaseModel):
    row: int
    col: int
    density: float
    temperature: float
    cell_type: str  # "gate", "seat", "aisle"
    seat_id: Optional[str] = None


class VenueState(BaseModel):
    grid: list[list[CellState]]
    tick: int
    incentive_events: list["IncentiveEvent"] = []


# ── Flow Agent (Cool Path) ────────────────────────────
class PathRequest(BaseModel):
    start_row: int = 0
    start_col: int = 0
    seat_id: str


class PathStep(BaseModel):
    row: int
    col: int
    density: float


class PathResponse(BaseModel):
    seat_id: str
    target_row: int
    target_col: int
    path: list[PathStep]
    total_cost: float


# ── Sync Agent (Incentive Events) ─────────────────────
class IncentiveEvent(BaseModel):
    type: str = "incentive"
    gate_id: str
    gate_row: int
    gate_col: int
    trivia: str
    reward: str
    delay_suggestion_minutes: int
    timestamp: str


# ── Guardian Agent (SOS) ──────────────────────────────
class SOSRequest(BaseModel):
    seat_id: str


class SOSResponse(BaseModel):
    seat_id: str
    x: int
    y: int
    alert_level: str = "HIGH"
    message: str
    timestamp: str


class StaffAlert(BaseModel):
    id: int
    seat_id: str
    x: int
    y: int
    alert_level: str
    message: str
    timestamp: str
    resolved: bool = False


# ── Line-Buddy ────────────────────────────────────────
class JoinQueueRequest(BaseModel):
    user_id: str
    fan_interest: str


class JoinQueueResponse(BaseModel):
    user_id: str
    matched: bool
    match_user_id: Optional[str] = None
    fan_interest: str
    icebreaker: Optional[str] = None
    position_in_queue: Optional[int] = None
