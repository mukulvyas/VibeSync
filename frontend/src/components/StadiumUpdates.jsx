import React, { useEffect, useState, useCallback } from 'react';
import { useMatchSimulation } from '../hooks/useMatchSimulation';

/**
 * generateUpdateFromState
 * Converts current matchState and lastEvent into a fan-friendly update card.
 */
const generateUpdateFromState = (matchState, lastEvent) => {
  const { capacity, noise_db } = matchState;
  const north = capacity?.north || 89;
  const south = capacity?.south || 76;
  const east = capacity?.east || 82;
  const west = capacity?.west || 71;

  // Priority logic — most urgent first
  if (north > 90) return {
    icon: "⚠️",
    title: "North Stand very crowded",
    detail: `${north}% full — avoid North concourse`,
    type: "warning"
  };
  if (lastEvent === "WICKET") return {
    icon: "🚪",
    title: "Gate S2 recommended after wicket",
    detail: "South exit clear — least congested now",
    type: "navigation"
  };
  if (lastEvent === "SIX") return {
    icon: "💡",
    title: "Great time to grab food!",
    detail: "Food Court Zone C — 5 min walk west",
    type: "amenity"
  };
  if (noise_db > 95) return {
    icon: "💧",
    title: "Stay hydrated — it's loud out there!",
    detail: "Hydration station 65m east, no queue",
    type: "amenity"
  };
  if (west < 65) return {
    icon: "💡",
    title: "West Stand has space",
    detail: `Only ${west}% full — great viewing spot`,
    type: "navigation"
  };

  // Rotate through amenity tips by time
  const minute = new Date().getMinutes();
  const tips = [
    {
      icon: "🚻",
      title: "Washroom Hub 08 nearby",
      detail: "87m south concourse, 2 min wait",
      type: "amenity"
    },
    {
      icon: "💧", 
      title: "Hydration station — no queue",
      detail: "65m east concourse, free water",
      type: "amenity"
    },
    {
      icon: "🍔",
      title: "Food Court Zone C open",
      detail: "120m west concourse, 5 min wait",
      type: "amenity"
    },
    {
      icon: "🚪",
      title: "Gate S2 is your nearest exit",
      detail: "South concourse, 2 min walk",
      type: "navigation"
    },
    {
      icon: "☀️",
      title: "Hot day — 29°C outside",
      detail: "Shaded seating available West Stand",
      type: "amenity"
    },
    {
      icon: "💡",
      title: "Pro tip: West concourse quieter",
      detail: "Less crowded than South right now",
      type: "navigation"
    },
  ];
  return tips[minute % tips.length];
};

/**
 * StadiumUpdates Component
 * Displays a stack of dynamic stadium updates generated from local simulation state.
 */
const StadiumUpdates = () => {
  const { matchState, lastEvent } = useMatchSimulation();
  const [updates, setUpdates] = useState([]);

  const addUpdate = useCallback(() => {
    const newUpdate = {
      ...generateUpdateFromState(matchState, lastEvent),
      id: Date.now(),
      time: "Just now"
    };

    setUpdates(prev => {
      // Don't add the same tip twice in a row if it's identical
      if (prev.length > 0 && prev[0].title === newUpdate.title) return prev;

      return [
        newUpdate,
        ...prev.slice(0, 4).map((u, i) => ({
          ...u,
          time: ["2 min ago", "5 min ago", "10 min ago", "15 min ago"][i] || "15 min ago"
        }))
      ];
    });
  }, [matchState, lastEvent]);

  // Initial update on mount
  useEffect(() => {
    addUpdate();
    const interval = setInterval(addUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [addUpdate]);

  // Reactive update on big match events
  useEffect(() => {
    if (lastEvent === "WICKET" || 
        lastEvent === "SIX" ||
        lastEvent === "FULL_HOUSE") {
      addUpdate();
    }
  }, [lastEvent, addUpdate]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="px-2">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Stadium Updates</h3>
        <p className="text-[10px] font-bold text-text-secondary mt-1">Last updated: just now</p>
      </div>

      {/* Updates Stack */}
      <div className="space-y-4">
        {updates.map((item) => (
          <div 
            key={item.id}
            className={`p-6 glass-tactical rounded-3xl border-l-4 ${item.type === 'warning' ? 'border-accent-red' : 'border-accent-gold'} relative overflow-hidden transition-all duration-500 animate-slide-in shadow-2xl`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" role="img" aria-label="Update icon">
                {item.icon || '📢'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] font-black text-accent-gold uppercase tracking-wider">
                    {item.type || 'Stadium Update'}
                  </p>
                  <span className="text-[9px] font-bold text-text-secondary opacity-60">
                    {item.time}
                  </span>
                </div>
                <h4 className="text-[15px] font-black text-white mb-2 leading-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                  {item.detail}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Live Intelligence Protocol</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StadiumUpdates;
