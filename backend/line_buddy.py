"""
Line-Buddy — Queue matching by shared fan interest.

In-memory mock database that matches users with the same fan_interest
and returns a social icebreaker prompt.
"""

import random
from datetime import datetime, timezone
from models import JoinQueueRequest, JoinQueueResponse

ICEBREAKER_TEMPLATES = [
    "You both love {interest}! Ask them about their favorite match moment.",
    "Bonding time! You and your buddy both picked '{interest}'. Debate: best season ever?",
    "Queue buddies united by '{interest}'! Challenge: who knows more stats?",
    "You're both fans of {interest}! Start with: 'What got you hooked?'",
    "Perfect match! Talk about {interest} — who's the GOAT and why?",
    "Two {interest} fans in one queue? Discuss your most memorable game!",
    "Your Line-Buddy also loves {interest}. Ice-breaker: 'Unpopular opinion about {interest}?'",
]


class LineBuddy:
    def __init__(self):
        # { fan_interest: [{ user_id, timestamp }] }
        self.queue: dict[str, list[dict]] = {}

    def join_queue(self, request: JoinQueueRequest) -> JoinQueueResponse:
        """Add user to queue. If a match exists, pair them and return icebreaker."""
        interest = request.fan_interest.strip().lower()

        # Check for existing user with same interest
        if interest in self.queue and len(self.queue[interest]) > 0:
            # Pop the first waiting user — they're matched
            match = self.queue[interest].pop(0)
            if len(self.queue[interest]) == 0:
                del self.queue[interest]

            icebreaker = random.choice(ICEBREAKER_TEMPLATES).format(
                interest=request.fan_interest
            )

            return JoinQueueResponse(
                user_id=request.user_id,
                matched=True,
                match_user_id=match["user_id"],
                fan_interest=request.fan_interest,
                icebreaker=icebreaker,
            )

        # No match — add to queue
        if interest not in self.queue:
            self.queue[interest] = []

        self.queue[interest].append(
            {
                "user_id": request.user_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

        position = len(self.queue[interest])

        return JoinQueueResponse(
            user_id=request.user_id,
            matched=False,
            fan_interest=request.fan_interest,
            position_in_queue=position,
        )

    def get_queue_stats(self) -> dict:
        """Return current queue statistics."""
        return {
            interest: len(users)
            for interest, users in self.queue.items()
        }
