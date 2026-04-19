import os
import random
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

FALLBACK_RESPONSES = [
    "Gate S2 is your nearest exit — clear right now!",
    "Washroom Hub 08 is 87m away, 2 min wait.",
    "Hydration station is 65m south, no queue.",
    "North Stand is at 89% — I'd avoid that route.",
    "Food court Zone C is 120m west, 5 min wait.",
]

CATEGORIES = [
    "washroom",
    "food_court", 
    "hydration",
    "crowd_warning",
    "exit_gate",
    "weather",
    "general_tip"
]

FALLBACKS = {
    "washroom": {
        "icon": "🚻",
        "title": "Washroom Hub 08 — 2 min wait",
        "detail": "87m south concourse from your seat",
        "type": "amenity"
    },
    "food_court": {
        "icon": "🍔", 
        "title": "Food Court Zone C open",
        "detail": "120m west, current wait 5 minutes",
        "type": "amenity"
    },
    "hydration": {
        "icon": "💧",
        "title": "Hydration station — no queue",
        "detail": "65m east concourse, free water available",
        "type": "amenity"
    },
    "crowd_warning": {
        "icon": "⚠️",
        "title": "North Stand is very busy",
        "detail": "89% full — avoid North concourse now",
        "type": "warning"
    },
    "exit_gate": {
        "icon": "🚪",
        "title": "Gate S2 is your best exit",
        "detail": "Least congested gate from South Stand",
        "type": "navigation"
    },
    "weather": {
        "icon": "☀️",
        "title": "Hot day — stay hydrated",
        "detail": "29°C outside, water stations nearby",
        "type": "amenity"
    },
    "general_tip": {
        "icon": "💡",
        "title": "Pro tip for South Stand fans",
        "detail": "West concourse less crowded right now",
        "type": "navigation"
    }
}

STADIUM_CONTEXT = """
You are VibeSync Concierge, a fast, helpful AI assistant 
at Wankhede Cricket Stadium during a live IND vs AUS match.

You help fans with:
- Finding exits, washrooms, and food (based on crowd levels)
- Quick match vibe updates

CRITICAL RULES:
1. NO MARKDOWN, NO BULLETS, NO HEADERS. Keep it conversational.
2. ULTRA-SHORT RESPONSES ONLY. Maximum 2 short sentences.
3. Be less specific about exact stall names. Just give broad, helpful advice like "Head to the West Wing, it has the shortest lines right now."
4. Never make up specific scores.
"""

async def get_concierge_response(
    user_message: str, 
    venue_state: dict = None,
    history: list = []
) -> str:
    try:
        context = STADIUM_CONTEXT
        if venue_state:
            context += f"""
Current venue state:
- North Stand: {venue_state.get('north', 89)}% capacity
- South Stand: {venue_state.get('south', 76)}% capacity
- East VIP: {venue_state.get('east', 82)}% capacity  
- West Stand: {venue_state.get('west', 71)}% capacity
- Noise level: {venue_state.get('noise_db', 86)}dB
"""
        
        # Prepare content for multi-turn
        contents = []
        
        # Add system context as a pre-instruction if available or just prepend to first message
        # For simplicity with genai SDK, we'll prepend context to the first message if no history,
        # or use it to reinforce the first turn.
        
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.get("text", "")}]
            })
            
        # Add current message with context if it's the start
        current_text = user_message
        if not history:
            current_text = f"{context}\n\n{user_message}"
        else:
            # Reinforce context gently
            current_text = f"[Context: {venue_state.get('north', 89)}% North, {venue_state.get('south', 76)}% South]\n{user_message}"
            
        contents.append({
            "role": "user",
            "parts": [{"text": current_text}]
        })

        response = client.models.generate_content(
            model='gemma-4-26b-a4b-it',
            contents=contents
        )
        return response.text.strip()
        
    except Exception as e:
        print(f"Gemini error: {e}")
        # Return a more neutral fallback if AI fails, rather than a random fact
        return "I'm having a bit of trouble reaching the stadium intelligence link. Standard operations are continuing normally!"


async def get_agent_insight(
    venue_state: dict, 
    event_type: str = None
) -> dict:
    try:
        prompt = f"""Stadium AI agent at Wankhede Cricket Stadium.

Venue: North={venue_state.get('north',89)}%, 
South={venue_state.get('south',76)}%,
East={venue_state.get('east',82)}%, 
West={venue_state.get('west',71)}%
Noise: {venue_state.get('noise_db',86)}dB
Event: {event_type or 'routine play'}

Give ONE operational message (max 12 words).
No agent name prefix. Just the message."""

        response = client.models.generate_content(
            model='gemma-4-26b-a4b-it',
            contents=prompt
        )
        message = response.text.strip()
        
        if event_type in ["WICKET", "SIX", "WICKET_STORM"]:
            agent, color = "Flow Agent", "#F97316"
        elif event_type in ["RAIN_DELAY", "MATCH_OVER"]:
            agent, color = "Guardian", "#3B82F6"
        elif event_type == "FULL_HOUSE":
            agent, color = "Sync Agent", "#8B5CF6"
        else:
            agent, color = random.choice([
                ("Guardian", "#10B981"),
                ("Sync Agent", "#3B82F6"),
                ("Flow Agent", "#F97316"),
            ])
            
        # Calculate operational metrics
        max_density = max(
            venue_state.get('north', 0),
            venue_state.get('south', 0),
            venue_state.get('east', 0),
            venue_state.get('west', 0)
        )
        avg_density = (
            venue_state.get('north', 0) + 
            venue_state.get('south', 0) + 
            venue_state.get('east', 0) + 
            venue_state.get('west', 0)
        ) / 4

        # Confidence drops when crowds are high or events are volatile
        confidence = 96 - max(0, (max_density - 70) // 2)
        if event_type in ["WICKET", "SIX", "WICKET_STORM"]:
            confidence -= 4
        confidence = max(82, min(99, confidence))

        # Efficiency delta - how much "friction" we are removing
        efficiency_delta = -8 - (avg_density // 10)
        if event_type == "WICKET_STORM":
            efficiency_delta -= 5

        return {
            "agent": agent,
            "color": color,
            "message": message,
            "confidence": f"{int(confidence)}%",
            "confidence_val": int(confidence),
            "efficiency_delta": f"{int(efficiency_delta)}% Congestion",
            "source": "gemini"
        }
        
    except Exception as e:
        print(f"Gemini agent error: {e}")
        return {
            "agent": "Guardian",
            "color": "#10B981",
            "message": random.choice([
                "All sectors nominal. Monitoring active.",
                "Gate flow stable. Concourse clear.",
                "Perimeter scan complete. All clear.",
            ]),
            "source": "fallback"
        }


async def get_stadium_update(
    venue_state: dict,
    last_event: str = None,
    history: list = [],
    last_category: str = None
) -> dict:
    try:
        # 1. Determine selected category
        north = venue_state.get('north', 89)
        noise_db = venue_state.get('noise_db', 86)
        
        selected_category = None
        if north > 90:
            selected_category = "crowd_warning"
        elif last_event == "WICKET":
            selected_category = "exit_gate"
        elif last_event == "SIX":
            selected_category = "general_tip"
        elif noise_db > 95:
            selected_category = "hydration"
        else:
            # Rotate through categories
            available = [c for c in CATEGORIES if c != last_category]
            selected_category = random.choice(available)

        history_str = (
            "\n".join([f"- {h}" for h in history[-3:]])
            if history else "None yet"
        )
        
        prompt = f"""You are a helpful stadium assistant 
at Wankhede Cricket Stadium during IND vs AUS T20.

Current situation:
- North Stand: {venue_state.get('north', 89)}% full
- South Stand: {venue_state.get('south', 76)}% full
- East VIP: {venue_state.get('east', 82)}% full
- West Stand: {venue_state.get('west', 71)}% full
- Noise level: {venue_state.get('noise_db', 86)}dB
- Last match event: {last_event or 'routine play'}
- Fan's seat: SEC-SOUTH, Row 12

Last update was about: {last_category or 'None'}
You MUST pick a completely different topic this time.

Topic to cover: {selected_category}
Helpful guide for topics:
- washroom: nearest washroom wait time and distance
- food_court: food court queue and location
- hydration: water station status
- crowd_warning: which stand to avoid and why
- exit_gate: best exit route right now
- weather: heat/sun/comfort tip for fans
- general_tip: any other useful stadium tip

Recent updates already shown (don't repeat these):
{history_str}

Respond ONLY with valid JSON, exactly this format:
{{
  "icon": "single emoji",
  "title": "short title under 8 words",
  "detail": "helpful detail under 15 words",
  "type": "navigation|amenity|warning"
}}

No extra text, no markdown, just the JSON object."""

        response = client.models.generate_content(
            model='gemma-4-26b-a4b-it',
            contents=prompt
        )
        text = response.text.strip()
        
        # Clean up if model wraps in markdown
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                if part.strip().startswith("{") or part.strip().startswith("json"):
                    text = part.strip()
                    if text.startswith("json"):
                        text = text[4:].strip()
                    break
        
        import json
        data = json.loads(text.strip())
        
        # Validate required fields
        assert "icon" in data
        assert "title" in data
        assert "detail" in data
        assert "type" in data
        
        return {
            "icon": data["icon"],
            "title": data["title"],
            "detail": data["detail"],
            "type": data["type"],
            "time": "Just now",
            "source": "gemini",
            "category": selected_category
        }
        
    except Exception as e:
        print(f"Stadium update error: {e}")
        # Fallback based on selected_category (or random if logic failed)
        cat = selected_category or random.choice(CATEGORIES)
        fallback_data = FALLBACKS.get(cat, FALLBACKS["general_tip"])
        
        return {
            **fallback_data,
            "time": "Just now",
            "source": "fallback",
            "category": cat
        }

