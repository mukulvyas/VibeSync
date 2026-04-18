/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        data: ["Space Mono", "monospace"],
      },
      colors: {
        vibe: {
          dark: "#060B14",
          panel: "#162030",
          card: "#0E1623",
          border: "rgba(99, 179, 237, 0.12)",
          cyan: "#3B82F6",
          glow: "#60A5FA",
          amber: "#F59E0B",
          red: "#EF4444",
          green: "#10B981",
        },
        "cyan-tactical": "#3B82F6",
        "amber-tactical": "#F59E0B",
        "red-tactical": "#EF4444",
        "green-tactical": "#10B981",
        "bg-space": "#060B14",
        "bg-panel": "#162030",
        "bg-card": "#0E1623",
        "text-primary": "#F0F4FF",
        "text-dim": "#8BA3C4",
        "text-data": "#E2E8F0",
        "border-dim": "rgba(99, 179, 237, 0.12)",
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-magenta': '0 0 20px rgba(217, 70, 239, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'ripple': 'ripple 1.5s ease-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
