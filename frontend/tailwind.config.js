/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        vibe: {
          dark: '#0a0a1a',
          panel: '#111128',
          card: '#1a1a3e',
          border: '#2a2a5a',
          cyan: '#06b6d4',
          magenta: '#d946ef',
          lime: '#84cc16',
          amber: '#f59e0b',
          red: '#ef4444',
        },
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
