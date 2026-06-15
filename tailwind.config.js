/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-bg': '#0a0e27',
        'deep-card': '#111640',
        'deep-border': '#1e2a5e',
        'neon-cyan': '#00f5d4',
        'neon-cyan-dim': '#00c4aa',
        'amber-warn': '#ff6b35',
        'rose-critical': '#f72585',
        'steel': '#8892b0',
        'slate-dim': '#4a5568',
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        noto: ['Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,245,212,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0,245,212,0.6)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
