import React, { useState, useEffect, useRef } from 'react';
import { getAgentInsight } from '../utils/api';

/**
 * AIInsightDrawer — A floating glassmorphism panel.
 * For Staff: Shows high-level tactical insights.
 * For Attendees: Shows a conversational AI Concierge.
 */
export default function AIInsightDrawer({ isOpen, onClose, attendeeMode = false, matchState, lastEvent, seatInfo }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      text: attendeeMode 
        ? "Hello! I'm your VibeSync Concierge. How can I help you enjoy the match today?" 
        : "Operational insight ready. Live telemetry analysis active."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [opsInsight, setOpsInsight] = useState(null);
  const scrollRef = useRef(null);


  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Generate local Ops insight when opened in staff mode
  useEffect(() => {
    if (isOpen && !attendeeMode && matchState) {
      const generateOpsInsight = async () => {
        setIsLoading(true);
        // Simulate processing delay
        await new Promise(r => setTimeout(r, 600));
        
        try {
          const { north, south, east, west } = matchState.capacity;
          const maxCapacity = Math.max(north, south, east, west);
          
          let agent = "Flow Agent";
          let color = "var(--accent-primary)";
          let message = "All sectors nominal. Transit corridors clear.";
          let efficiency = "+5% Flow";
          let confidence = "92%";
          
          if (maxCapacity > 85) {
             const stands = { North: north, South: south, East: east, West: west };
             const fullStand = Object.keys(stands).find(k => stands[k] === maxCapacity);
             agent = "Guardian Agent";
             color = "#EF4444";
             message = `CRITICAL: ${fullStand} Stand has reached ${maxCapacity}% capacity. Recommend initiating overflow protocols.`;
             efficiency = "-18% Bottleneck";
             confidence = "98%";
          } else if (matchState.noise_db > 90) {
             agent = "Sync Agent";
             color = "#F59E0B";
             message = "High crowd energy detected. Concourse congestion likely building up.";
             efficiency = "-8% Dense";
             confidence = "87%";
          }
          
          setOpsInsight({ agent, color, message, confidence, efficiency_delta: efficiency });

        } catch (err) {
          console.error("Failed to generate Ops insight:", err);
        } finally {
          setIsLoading(false);
        }
      };
      generateOpsInsight();
    }
  }, [isOpen, attendeeMode, matchState]);

  const getResponse = (message, matchState) => {
    const msg = message.toLowerCase().trim();
    const { capacity, noise_db } = matchState || {};
    const north = capacity?.north || 89;
    const south = capacity?.south || 76;
    const east  = capacity?.east  || 82;
    const west  = capacity?.west  || 71;

    // Seat-specific helpers
    const si      = seatInfo;
    const myStand = si?.stand.label  || "SEC-SOUTH";
    const myRow   = si?.row          || 12;
    const mySeat  = si?.seat         || 43;
    const myGate  = si?.stand.gate   || "S2";
    const myCapacity = si ? (capacity?.[si.stand.key] || 76) : south;
    // GREETINGS
    if (msg.match(/^(hi|hello|hey|hii|helo|sup|hiya|yo)$/)) {
      return `Hi! I can help you find food courts, washrooms, water stations, or the best exit from your seat. What do you need?`;
    }

    // WHO ARE YOU
    if (msg.match(/who are you|what are you|are you ai|are you bot/)) {
      return `I'm VibeSync Concierge — your AI stadium assistant for this match. I can help with directions, facilities, and crowd info!`;
    }

    // FOOD
    if (msg.match(/food|eat|hungry|snack|burger|pizza|biryani|chai|coffee/)) {
      return `Food Court Zone C is 120m west of your seat — about a 5 minute walk. Current wait is around 5 minutes.`;
    }

    // WASHROOM
    if (msg.match(/wash|toilet|loo|bathroom|restroom|wc|washroom/)) {
      return `Nearest washroom is Hub 08, just 87m south down the concourse. Only a 2 minute wait right now.`;
    }

    // WATER
    if (msg.match(/water|hydrat|thirst/)) {
      return `Hydration station is 65m east of your seat on the east concourse. No queue right now — completely free.`;
    }

    // EXIT / GATE
    if (msg.match(/exit|gate|leave|out|go home|way out/)) {
      if (myCapacity > 85) {
        return `Gate ${myGate} is your nearest exit but ${myStand} is ${myCapacity}% full. I'd suggest waiting 10 minutes for the crowd to thin.`;
      }
      return `Gate ${myGate} is your nearest exit — 2 minute walk down the concourse. Currently clear.`;
    }

    // CROWD / BUSY
    if (msg.match(/crowd|busy|full|capacity|packed/)) {
      const busiest = Object.entries({
        'North Stand': north,
        'East VIP': east,
        'West Stand': west,
        'South Stand': south
      }).sort((a,b) => b[1]-a[1])[0];
      return `${busiest[0]} is the busiest right now at ${busiest[1]}% capacity. Your ${myStand} is at ${myCapacity}% — manageable.`;
    }

    // SCORE / MATCH
    if (msg.match(/score|match|wicket|over|run|cricket/)) {
      return `Check the scoreboard above for the latest score! The atmosphere is ${noise_db > 90 ? 'electric' : 'buzzing'} right now at ${noise_db}dB.`;
    }

    // SEAT / LOCATION
    if (msg.match(/seat|where am i|my seat|location/)) {
      return `You're in ${myStand}, Row ${myRow}, Seat ${mySeat}. Your nearest gate is ${myGate} and nearest washroom is Hub 08.`;
    }

    // PARKING
    if (msg.match(/park|car|auto|taxi|uber|ola|rickshaw/)) {
      return `Parking is available at Marine Lines. For taxis and autos, use Gate S1 exit on the south side of the stadium.`;
    }

    // MEDICAL / HELP
    if (msg.match(/help|emergency|medical|doctor|sick|hurt|ambulance/)) {
      return `For medical assistance, contact any staff member in a yellow vest or go to the First Aid station near Gate N1 on the north concourse.`;
    }

    // ATM / MONEY
    if (msg.match(/atm|cash|money|pay|payment|upi/)) {
      return `There are ATMs near Gate N1 and Gate W1. Most food stalls accept UPI and cards too.`;
    }

    // WIFI
    if (msg.match(/wifi|internet|network|connect|signal/)) {
      return `Stadium WiFi is "Wankhede_Guest" — no password needed. Currently showing optimal signal in your section.`;
    }

    // LOST / FOUND
    if (msg.match(/lost|found|missing|forgot/)) {
      return `Lost & Found is at the main reception near Gate N1. You can also ask any staff member in a yellow vest for help.`;
    }

    // CHILD / FAMILY
    if (msg.match(/child|kid|baby|family|stroller/)) {
      return `Family facilities are near Gate S1 — baby changing room and family washroom available. Priority queue at food counters too.`;
    }

    // ACCESSIBILITY
    if (msg.match(/wheelchair|disabled|accessib|mobility/)) {
      return `Accessible seating and ramps are available via Gate W1. Staff assistance available — just ask anyone in a yellow vest.`;
    }

    // WEATHER
    if (msg.match(/hot|cold|rain|weather|sun|heat/)) {
      return `It's 29°C outside today. Shaded seating is available in the West Stand upper tier. Free water at the east hydration station.`;
    }

    // NEXT MATCH / TICKETS
    if (msg.match(/ticket|next match|schedule|upcoming/)) {
      return `For upcoming match schedules and tickets visit bcci.tv or the official Wankhede Stadium website.`;
    }

    // THANKS
    if (msg.match(/thank|thanks|thx|great|awesome|helpful|good/)) {
      return `Happy to help! Enjoy the match! 🏏 Let me know if you need anything else.`;
    }

    // BORED / WAITING
    if (msg.match(/bored|waiting|slow|boring/)) {
      return `Grab some food from Zone C while you wait! Or check the atmosphere stats on the Home tab — noise is at ${noise_db}dB right now!`;
    }

    // TOO SHORT / GIBBERISH
    if (msg.length < 3) {
      return `I didn't catch that! Try asking me about food, washrooms, exits, or crowd levels.`;
    }

    // ROTATING DEFAULT for anything unrecognized
    const suggestions = [
      `I'm not sure about that, but I can help with directions to food courts, washrooms, water stations, or exits. What do you need?`,
      `That's outside my knowledge! Ask me about facilities, crowd levels, or how to get to your gate from ${myStand}.`,
      `I specialize in stadium navigation! Try asking "where is the washroom" or "which exit should I use".`,
    ];
    return suggestions[Math.floor(Date.now() / 1000) % 3];
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const currentMsg = inputValue;
    const userMsg = { id: Date.now(), role: 'user', text: currentMsg };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI thinking time
    await new Promise(r => setTimeout(r, 800));

    const responseText = getResponse(currentMsg, matchState);
    const aiMsg = { id: Date.now() + 1, role: 'ai', text: responseText };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[10002] flex justify-center px-0 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="w-full max-w-lg glass-drawer overflow-hidden flex flex-col max-h-[85vh]">
        {/* Drag Handle */}
        <div className="h-8 flex justify-center items-center cursor-pointer group shrink-0" onClick={onClose}>
          <div className="w-10 h-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />
        </div>

        {/* Header */}
        <div className="px-8 pb-4 flex items-center justify-between shrink-0 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-primary to-purple-500 flex items-center justify-center text-white text-lg shadow-lg">
              ✦
            </div>
            <div>
              <h3 className="text-[10px] font-black text-white tracking-[0.2em] font-heading uppercase">
                {attendeeMode ? "VibeSync Concierge" : "AI Operational Intel"}
              </h3>
              {attendeeMode && <span className="text-[8px] text-accent-green font-bold tracking-widest uppercase animate-pulse">Online</span>}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Chat / Content Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth h-full"
        >
          {attendeeMode ? (
            /* CONVERSATIONAL UI */
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-accent-primary text-white ml-8 rounded-tr-none' 
                      : 'bg-white/5 border border-white/5 text-white mr-8 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* LEGACY TACTICAL UI (FOR OPS) */
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <p className="text-lg font-bold text-white leading-relaxed">
                  {isLoading ? "Analyzing telemetry..." : (opsInsight?.message || "All sectors nominal. Monitoring active.")}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-text-secondary font-heading">
                    <span>{opsInsight?.agent || "AI Agent"} Insight</span>
                    <span className="text-accent-primary">{opsInsight?.confidence || "92%"} Confidence</span>
                  </div>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: opsInsight?.confidence || '92%', backgroundColor: opsInsight?.color || 'var(--accent-primary)' }} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase font-heading">Real-time Efficiency Delta</span>
                  <span className="text-xs font-bold text-accent-green font-data">{opsInsight?.efficiency_delta || "-14% Congestion"}</span>
                </div>
                <div className="h-12 w-full flex items-end">
                   <svg viewBox="0 0 400 60" className="w-full h-full stroke-accent-primary fill-none">
                      <path d="M0,50 Q50,45 100,55 T200,30 T300,10 T400,15" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
                      <circle cx="400" cy="15" r="4" fill="var(--accent-primary)" className="animate-pulse" />
                   </svg>
                </div>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  // No need to pass toast back up, we can just close the drawer
                  // The parent is expected to handle specific feedback if needed
                }} 
                className="w-full py-4 bg-accent-primary text-white font-black tracking-[0.2em] uppercase rounded-xl shadow-lg"
              >
                Apply Tactics
              </button>
            </div>
          )}
        </div>

        {/* Input Area (Attendee Mode Only) */}
        {attendeeMode && (
          <div className="p-6 pt-2 shrink-0 border-t border-white/5 bg-white/[0.02]">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about the match or amenities..."
                aria-label="Ask the VibeSync Concierge a question"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-5 pr-12 text-white text-[11px] placeholder:text-white/20 focus:outline-none focus:border-accent-primary/50 transition-colors"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 top-1.5 w-10 h-10 rounded-lg flex items-center justify-center text-accent-primary hover:bg-white/5 transition-all disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.155H13.5a.75.75 0 010 1.5H4.984l-2.432 7.155a.75.75 0 00.926.94l18.03-9.015a.75.75 0 000-1.342L3.478 2.405z" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
