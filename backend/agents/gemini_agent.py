"""
Optional Gemini 1.5 Flash integration for stadium operations intel.
Requires GEMINI_API_KEY in the environment; otherwise returns None.
"""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from venue import VenueSimulator


def build_venue_summary(venue: "VenueSimulator") -> str:
    """Compact text snapshot for the model."""
    densities = []
    for r, row in enumerate(venue.grid):
        for c, cell in enumerate(row):
            if cell["density"] > 0.65:
                densities.append(f"({r},{c}):{cell['density']:.2f}")
    hot = ", ".join(densities[:12]) if densities else "no hot cells"
    return (
        f"tick={venue.tick_count} noise_db={venue.noise_level_db} "
        f"aqi={venue.air_quality_aqi} wifi_mbps={venue.wifi_mesh_mbps}. "
        f"high_density_cells: {hot}"
    )


def get_gemini_ops_insight(venue: "VenueSimulator") -> str | None:
    """
    Send current venue state to Gemini; return one short ops line or None if disabled/unavailable.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        import google.generativeai as genai  # type: ignore[import-untyped]
    except ImportError:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        summary = build_venue_summary(venue)
        prompt = (
            "You are a stadium operations AI assistant. Given this live venue telemetry, "
            "respond with exactly ONE concise operational insight (max 140 characters), "
            "no quotes or markdown.\n\n"
            f"{summary}"
        )
        response = model.generate_content(prompt)
        text = (getattr(response, "text", None) or "").strip()
        if not text:
            return None
        return text[:280]
    except Exception:
        return None
