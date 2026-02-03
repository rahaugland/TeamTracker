/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          90: '#0f1e35',
          80: '#162843',
          70: '#1e3452',
          60: '#2a4268',
        },
        'vq-navy': '#0A1628',
        'navy-90': '#0f1e35',
        'club-primary': '#E63946',
        'club-primary-dim': '#c42d39',
        'club-secondary': '#FFB703',
        'vq-teal': '#2EC4B6',
      },
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-red': '0 4px 14px 0 rgba(230, 57, 70, 0.25)',
        'glow-gold': '0 4px 14px 0 rgba(255, 183, 3, 0.25)',
        'glow-teal': '0 4px 14px 0 rgba(46, 196, 182, 0.25)',
      },
    },
  },
  plugins: [],
}
